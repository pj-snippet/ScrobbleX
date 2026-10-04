import React, { useState, useMemo } from 'react';
import {
  Search,
  History,
  Calendar,
  X,
  ChevronRight,
  Filter,
  Clock,
  Sparkles,
  Music2,
  User2,
  Disc,
} from 'lucide-react';
import { AccentColor, Scrobble, Track } from '../types/music';
import {
  formatDateHuman,
  formatTimeUTC,
  getAlbumById,
  getArtistById,
  getTrackById,
} from '../domain/analyticsEngine';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface HistoryAndSearchScreenProps {
  scrobbles: Scrobble[];
  initialMode?: 'history' | 'search';
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor?: AccentColor;
}

export const HistoryAndSearchScreen: React.FC<HistoryAndSearchScreenProps> = ({
  scrobbles,
  initialMode = 'history',
  onSelectEntity,
}) => {
  const { tokens } = useTheme();
  const [mode, setMode] = useState<'history' | 'search'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [pageSize, setPageSize] = useState(30);

  // Filtered History
  const filteredScrobbles = useMemo(() => {
    let result = scrobbles;
    if (dateFilter) {
      result = result.filter((s) => s.dateKey.includes(dateFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const trk = getTrackById(s.trackId);
        const art = getArtistById(s.artistId);
        return (
          trk?.title.toLowerCase().includes(q) ||
          art?.name.toLowerCase().includes(q) ||
          trk?.albumTitle.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [scrobbles, dateFilter, searchQuery]);

  const pagedScrobbles = useMemo(() => {
    return filteredScrobbles.slice(0, pageSize);
  }, [filteredScrobbles, pageSize]);

  // Global Search Entities
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();

    // Search real user listening catalog from scrobbles
    const uniqueArtistIds = Array.from(new Set(scrobbles.map((s) => s.artistId)));
    const matchedArtists = [];
    for (const artId of uniqueArtistIds) {
      const art = getArtistById(artId);
      if (art && art.name.toLowerCase().includes(q)) {
        matchedArtists.push(art);
        if (matchedArtists.length >= 6) break;
      }
    }

    const uniqueAlbumIds = Array.from(new Set(scrobbles.map((s) => s.albumId)));
    const matchedAlbums = [];
    for (const albId of uniqueAlbumIds) {
      const alb = getAlbumById(albId);
      if (
        alb &&
        (alb.title.toLowerCase().includes(q) || alb.artistName.toLowerCase().includes(q))
      ) {
        matchedAlbums.push(alb);
        if (matchedAlbums.length >= 6) break;
      }
    }

    const uniqueTrackIds = Array.from(new Set(scrobbles.map((s) => s.trackId)));
    const matchedTracks = [];
    for (const trkId of uniqueTrackIds) {
      const trk = getTrackById(trkId);
      if (
        trk &&
        (trk.title.toLowerCase().includes(q) || trk.artistName.toLowerCase().includes(q))
      ) {
        matchedTracks.push(trk);
        if (matchedTracks.length >= 6) break;
      }
    }

    return {
      artists: matchedArtists,
      albums: matchedAlbums,
      tracks: matchedTracks,
    };
  }, [scrobbles, searchQuery]);

  return (
    <div className="space-y-4 pb-8">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 p-1 bg-app-card rounded-2xl border border-app">
        <button
          onClick={() => setMode('history')}
          style={{
            backgroundColor: mode === 'history' ? tokens.accentPrimary : 'transparent',
            color: mode === 'history' ? tokens.accentContrast : tokens.textMuted,
          }}
          className="py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          <span>Timeline History</span>
        </button>

        <button
          onClick={() => setMode('search')}
          style={{
            backgroundColor: mode === 'search' ? tokens.accentPrimary : 'transparent',
            color: mode === 'search' ? tokens.accentContrast : tokens.textMuted,
          }}
          className="py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Catalog Search</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            mode === 'history'
              ? 'Filter scrobbles by song, artist, album...'
              : 'Search artists, albums, or tracks in your history...'
          }
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-app-card border border-app text-xs text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-accent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Date Filter for History Mode */}
      {mode === 'history' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
          <button
            onClick={() => setDateFilter('')}
            style={{
              backgroundColor: !dateFilter ? tokens.accentSubtle : undefined,
              color: !dateFilter ? tokens.accentPrimary : tokens.textMuted,
            }}
            className={`px-3 py-1 rounded-xl border whitespace-nowrap cursor-pointer ${
              !dateFilter ? 'border-accent-subtle font-bold' : 'bg-app-card border-app'
            }`}
          >
            All Dates
          </button>
          {['2026-10-04', '2026-10-03', '2026-09-29', '2026-09-14', '2026-03-04'].map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(dateFilter === d ? '' : d)}
              style={{
                backgroundColor: dateFilter === d ? tokens.accentPrimary : undefined,
                color: dateFilter === d ? tokens.accentContrast : tokens.textMuted,
              }}
              className={`px-3 py-1 rounded-xl border whitespace-nowrap cursor-pointer ${
                dateFilter === d ? 'border-accent-subtle font-bold shadow-xs' : 'bg-app-card border-app'
              }`}
            >
              {d === '2026-10-04' ? 'Today' : d === '2026-10-03' ? 'Yesterday' : d}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH MODE CONTENT */}
      {mode === 'search' && searchResults && (
        <div className="space-y-4">
          {/* Artists */}
          {searchResults.artists.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-app-muted font-display uppercase tracking-wider flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5 text-accent" />
                <span>Artists</span>
              </h4>
              <div className="space-y-1.5">
                {searchResults.artists.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onSelectEntity({ type: 'artist', id: a.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ArtworkThumb src={a.artworkUrl} alt={a.name} sizeClass="w-9 h-9" roundedClass="rounded-full" />
                      <div>
                        <p className="text-xs font-bold text-app-primary group-hover:text-accent transition-colors font-display">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-app-muted">{a.primaryGenre || 'Artist'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app-primary" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums */}
          {searchResults.albums.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-app-muted font-display uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-accent" />
                <span>Albums</span>
              </h4>
              <div className="space-y-1.5">
                {searchResults.albums.map((alb) => (
                  <div
                    key={alb.id}
                    onClick={() => onSelectEntity({ type: 'album', id: alb.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ArtworkThumb src={alb.artworkUrl} alt={alb.title} sizeClass="w-9 h-9" roundedClass="rounded-xl" />
                      <div>
                        <p className="text-xs font-bold text-app-primary group-hover:text-accent transition-colors font-display">
                          {alb.title}
                        </p>
                        <p className="text-[10px] text-app-muted">{alb.artistName} ({alb.releaseYear})</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app-primary" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracks */}
          {searchResults.tracks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-app-muted font-display uppercase tracking-wider flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-accent" />
                <span>Tracks</span>
              </h4>
              <div className="space-y-1.5">
                {searchResults.tracks.map((trk) => (
                  <div
                    key={trk.id}
                    onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-9 h-9" roundedClass="rounded-xl" />
                      <div>
                        <p className="text-xs font-bold text-app-primary group-hover:text-accent transition-colors font-display">
                          {trk.title}
                        </p>
                        <p className="text-[10px] text-app-muted">{trk.artistName}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app-primary" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TIMELINE LIST */}
      {mode === 'history' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-app-muted px-1 font-mono">
            <span>{filteredScrobbles.length.toLocaleString()} matching scrobbles</span>
            {filteredScrobbles.length > pageSize && (
              <span>Showing first {pageSize}</span>
            )}
          </div>

          <div className="divide-y divide-app rounded-2xl bg-app-card border border-app overflow-hidden shadow-xs">
            {pagedScrobbles.map((s) => {
              const trk = getTrackById(s.trackId);
              if (!trk) return null;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                  className="flex items-center justify-between p-3 hover:bg-app-hover transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-10 h-10" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-app-primary truncate group-hover:text-accent transition-colors font-display">
                        {trk.title}
                      </p>
                      <p className="text-[11px] text-app-muted truncate">{trk.artistName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2 font-mono text-[10px] text-app-muted">
                    <p className="font-semibold text-app-secondary">{formatDateHuman(s.dateKey)}</p>
                    <p>{formatTimeUTC(s.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredScrobbles.length > pageSize && (
            <button
              onClick={() => setPageSize((prev) => prev + 30)}
              className="w-full py-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app text-xs font-mono text-app-primary transition-colors cursor-pointer"
            >
              Load 30 More Scrobbles...
            </button>
          )}
        </div>
      )}
    </div>
  );
};
