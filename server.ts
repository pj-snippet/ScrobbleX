import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last.fm API Credentials (secure server-side only)
// Default public prototype read key ensures immediate functionality if .env has not been set yet
const DEFAULT_LASTFM_API_KEY = '264e16d4187a5f6e80b2742d45a9526a';
const DEFAULT_LASTFM_SHARED_SECRET = '6a6b8ea278f2445b23d922a6136d88ae';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY?.trim() || DEFAULT_LASTFM_API_KEY;
const LASTFM_SHARED_SECRET = process.env.LASTFM_SHARED_SECRET?.trim() || DEFAULT_LASTFM_SHARED_SECRET;
const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

function generateLastFmSignature(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== 'format' && k !== 'callback')
    .sort();
  let sigString = '';
  for (const key of sortedKeys) {
    sigString += `${key}${params[key]}`;
  }
  sigString += secret;
  return crypto.createHash('md5').update(sigString, 'utf8').digest('hex');
}

function sanitizeId(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 80);
}

function extractImageUrl(images: any[] | undefined): string {
  if (!Array.isArray(images) || images.length === 0) return '';
  const preferred =
    images.find((img) => img.size === 'extralarge') ||
    images.find((img) => img.size === 'large') ||
    images.find((img) => img.size === 'medium') ||
    images[0];
  const url = preferred?.['#text'] || '';
  if (url.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
    // Last.fm generic gray placeholder image
    return '';
  }
  return url;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'ScrobbleX',
      lastfmConfigured: Boolean(LASTFM_API_KEY),
    });
  });

  // Last.fm Configuration Status
  app.get('/api/lastfm/status', (_req, res) => {
    res.json({
      configured: Boolean(LASTFM_API_KEY),
      hasCustomKey: Boolean(process.env.LASTFM_API_KEY),
      hasCustomSecret: Boolean(process.env.LASTFM_SHARED_SECRET),
    });
  });

  // Step 1: Generate official Last.fm authorization URL
  app.get('/api/lastfm/auth-url', (req, res) => {
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const callbackUrl = (req.query.callback as string) || `${origin}/?auth_callback=1`;
    const authUrl = `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(
      LASTFM_API_KEY
    )}&cb=${encodeURIComponent(callbackUrl)}`;

    res.json({
      authUrl,
      apiKey: LASTFM_API_KEY,
    });
  });

  // Step 2: Exchange token for authenticated session (Official Last.fm auth.getSession)
  app.post('/api/lastfm/session', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Missing or invalid authentication token.' });
        return;
      }

      const params: Record<string, string> = {
        api_key: LASTFM_API_KEY,
        method: 'auth.getSession',
        token,
      };

      const apiSig = generateLastFmSignature(params, LASTFM_SHARED_SECRET);
      const queryParams = new URLSearchParams({
        ...params,
        api_sig: apiSig,
        format: 'json',
      });

      const response = await fetch(`${LASTFM_API_BASE}?${queryParams.toString()}`);
      const data = await response.json();

      if (data.error) {
        res.status(400).json({
          error: data.message || 'Last.fm authentication failed.',
          code: data.error,
        });
        return;
      }

      const session = data.session;
      const username = session.name;
      const sessionKey = session.key;

      // Fetch user profile info
      const userInfoUrl = `${LASTFM_API_BASE}?method=user.getinfo&user=${encodeURIComponent(
        username
      )}&api_key=${encodeURIComponent(LASTFM_API_KEY)}&format=json`;
      const userInfoRes = await fetch(userInfoUrl);
      const userInfoData = await userInfoRes.json();
      const u = userInfoData.user || {};

      const registeredUnixtime = parseInt(u.registered?.unixtime || '0', 10) || Math.floor(Date.now() / 1000);
      const memberSinceDate = new Date(registeredUnixtime * 1000).toISOString().split('T')[0];

      const userProfile = {
        username: u.name || username,
        displayName: u.realname || u.name || username,
        avatarUrl: extractImageUrl(u.image) || '',
        memberSince: memberSinceDate,
        registeredTimestamp: registeredUnixtime,
        country: u.country || 'Global',
        totalScrobbles: parseInt(u.playcount || '0', 10),
        currentObsessionTrackId: '',
        pinnedTrackId: '',
      };

      res.json({
        success: true,
        session: {
          username,
          sessionKey,
        },
        userProfile,
      });
    } catch (err: any) {
      console.error('Error exchanging Last.fm session:', err);
      res.status(500).json({ error: 'Server error processing Last.fm authentication.' });
    }
  });

  // Step 3: Connect via Last.fm username directly
  app.post('/api/lastfm/connect', async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        res.status(400).json({ error: 'Username is required.' });
        return;
      }

      const cleanUsername = username.trim();
      const url = `${LASTFM_API_BASE}?method=user.getinfo&user=${encodeURIComponent(
        cleanUsername
      )}&api_key=${encodeURIComponent(LASTFM_API_KEY)}&format=json`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        res.status(404).json({
          error: data.message || `Last.fm user "${cleanUsername}" not found.`,
          code: data.error,
        });
        return;
      }

      const u = data.user || {};
      const registeredUnixtime = parseInt(u.registered?.unixtime || '0', 10) || Math.floor(Date.now() / 1000);
      const memberSinceDate = new Date(registeredUnixtime * 1000).toISOString().split('T')[0];

      const userProfile = {
        username: u.name || cleanUsername,
        displayName: u.realname || u.name || cleanUsername,
        avatarUrl: extractImageUrl(u.image) || '',
        memberSince: memberSinceDate,
        registeredTimestamp: registeredUnixtime,
        country: u.country || 'Global',
        totalScrobbles: parseInt(u.playcount || '0', 10),
        currentObsessionTrackId: '',
        pinnedTrackId: '',
      };

      res.json({
        success: true,
        userProfile,
      });
    } catch (err: any) {
      console.error('Error fetching Last.fm user info:', err);
      res.status(500).json({ error: 'Server error connecting to Last.fm.' });
    }
  });

  // Step 4: Fetch Paginated Recent Tracks
  app.get('/api/lastfm/recent-tracks', async (req, res) => {
    try {
      const username = (req.query.username as string)?.trim();
      if (!username) {
        res.status(400).json({ error: 'Username parameter is required.' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(200, Math.max(10, parseInt(req.query.limit as string, 10) || 200));
      const from = req.query.from ? parseInt(req.query.from as string, 10) : undefined;
      const to = req.query.to ? parseInt(req.query.to as string, 10) : undefined;

      const params = new URLSearchParams({
        method: 'user.getrecenttracks',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: limit.toString(),
        page: page.toString(),
        extended: '1',
      });

      if (from) params.set('from', from.toString());
      if (to) params.set('to', to.toString());

      const url = `${LASTFM_API_BASE}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        res.status(400).json({
          error: data.message || 'Failed to fetch scrobbles from Last.fm.',
          code: data.error,
        });
        return;
      }

      const recenttracks = data.recenttracks || {};
      const attr = recenttracks['@attr'] || {};
      const rawTracks = recenttracks.track || [];
      const trackList = Array.isArray(rawTracks) ? rawTracks : [rawTracks];

      const scrobbles: any[] = [];
      const artistsMap = new Map<string, any>();
      const albumsMap = new Map<string, any>();
      const tracksCatalogMap = new Map<string, any>();

      for (const t of trackList) {
        if (!t) continue;
        const artistName = (typeof t.artist === 'object' ? t.artist?.name : t.artist) || 'Unknown Artist';
        const artistId = `art_${sanitizeId(artistName)}`;
        const artistArtwork = extractImageUrl(t.artist?.image) || extractImageUrl(t.image);

        if (!artistsMap.has(artistId)) {
          artistsMap.set(artistId, {
            id: artistId,
            name: artistName,
            artworkUrl: artistArtwork,
            primaryGenre: 'Music',
          });
        }

        const albumTitle = (typeof t.album === 'object' ? t.album?.['#text'] : t.album) || 'Single';
        const albumId = `alb_${sanitizeId(`${artistName}_${albumTitle}`)}`;
        const albumArtwork = extractImageUrl(t.image);

        if (!albumsMap.has(albumId)) {
          albumsMap.set(albumId, {
            id: albumId,
            title: albumTitle,
            artistId,
            artistName,
            artworkUrl: albumArtwork,
            releaseYear: new Date().getFullYear(),
          });
        }

        const trackTitle = t.name || 'Unknown Track';
        const trackId = `trk_${sanitizeId(`${artistName}_${trackTitle}`)}`;
        const trackArtwork = albumArtwork;
        const isLoved = t.loved === '1';

        if (!tracksCatalogMap.has(trackId)) {
          tracksCatalogMap.set(trackId, {
            id: trackId,
            title: trackTitle,
            artistId,
            artistName,
            albumId,
            albumTitle,
            artworkUrl: trackArtwork,
            durationSec: 210,
            loved: isLoved,
          });
        }

        const isNowPlaying = t['@attr']?.nowplaying === 'true';
        const uts = t.date?.uts ? parseInt(t.date.uts, 10) : Math.floor(Date.now() / 1000);
        const dateObj = new Date(uts * 1000);
        const dateKey = dateObj.toISOString().split('T')[0];

        scrobbles.push({
          id: `scrobble_${sanitizeId(username)}_${uts}_${trackId}`,
          trackId,
          artistId,
          albumId,
          timestamp: uts,
          timestampUTC: dateObj.toISOString(),
          dateKey,
          year: dateObj.getUTCFullYear(),
          month: dateObj.getUTCMonth() + 1,
          dayOfWeek: dateObj.getUTCDay() === 0 ? 7 : dateObj.getUTCDay(),
          hourOfDay: dateObj.getUTCHours(),
          durationSec: 210,
          nowPlaying: isNowPlaying,
          loved: isLoved,
          source: from ? 'incremental-sync' : 'lastfm-api',
        });
      }

      res.json({
        scrobbles,
        artists: Array.from(artistsMap.values()),
        albums: Array.from(albumsMap.values()),
        tracks: Array.from(tracksCatalogMap.values()),
        pagination: {
          page: parseInt(attr.page || '1', 10),
          totalPages: parseInt(attr.totalPages || '1', 10),
          total: parseInt(attr.total || '0', 10),
          perPage: parseInt(attr.perPage || limit.toString(), 10),
        },
      });
    } catch (err: any) {
      console.error('Error fetching recent tracks:', err);
      res.status(500).json({ error: 'Server error retrieving Last.fm scrobbles.' });
    }
  });

  // Step 5: Fetch Loved Tracks
  app.get('/api/lastfm/loved-tracks', async (req, res) => {
    try {
      const username = (req.query.username as string)?.trim();
      if (!username) {
        res.status(400).json({ error: 'Username parameter is required.' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string, 10) || 50));

      const url = `${LASTFM_API_BASE}?method=user.getlovedtracks&user=${encodeURIComponent(
        username
      )}&api_key=${encodeURIComponent(LASTFM_API_KEY)}&format=json&limit=${limit}&page=${page}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        res.status(400).json({ error: data.message || 'Failed to fetch loved tracks.' });
        return;
      }

      const lovedtracks = data.lovedtracks || {};
      const rawTracks = lovedtracks.track || [];
      const trackList = Array.isArray(rawTracks) ? rawTracks : [rawTracks];

      const lovedTrackIds: string[] = [];
      const tracks: any[] = [];

      for (const t of trackList) {
        if (!t) continue;
        const artistName = (typeof t.artist === 'object' ? t.artist?.name : t.artist) || 'Unknown Artist';
        const artistId = `art_${sanitizeId(artistName)}`;
        const trackTitle = t.name || 'Unknown Track';
        const trackId = `trk_${sanitizeId(`${artistName}_${trackTitle}`)}`;
        const artworkUrl = extractImageUrl(t.image);
        lovedTrackIds.push(trackId);

        tracks.push({
          id: trackId,
          title: trackTitle,
          artistId,
          artistName,
          albumId: '',
          albumTitle: '',
          artworkUrl,
          durationSec: 210,
          loved: true,
          lovedAt: t.date?.uts ? parseInt(t.date.uts, 10) : undefined,
        });
      }

      res.json({
        lovedTrackIds,
        tracks,
        total: parseInt(lovedtracks['@attr']?.total || '0', 10),
      });
    } catch (err: any) {
      console.error('Error fetching loved tracks:', err);
      res.status(500).json({ error: 'Server error retrieving loved tracks.' });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
