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
import { ARTISTS_CATALOG, ALBUMS_CATALOG, TRACKS_CATALOG } from '../data/localDatabase';
import { AccentColor, Scrobble, Track } from '../types/music';
import {
  formatDateHuman,
  formatTimeUTC,
  getAlbumById,
  getArtistById,
  getTrackById,
} from '../domain/analyticsEngine';
import { ACCENT_THEMES } from '../domain/themeConfig';
import { ArtworkThumb } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface HistoryAndSearchScreenProps {
  scrobbles: Scrobble[];
  initialMode?: 'history' | 'search';
  onSelectEntity: (entity: SelectedEntity) => void;
  accentColor: AccentColor;
}

export const HistoryAndSearchScreen: React.FC<HistoryAndSearchScreenProps> = ({
  scrobbles,
  initialMode = 'history',
  onSelectEntity,
  accentColor,
}) => {
  const [mode, setMode] = useState<'history' | 'search'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [pageSize, setPageSize] = useState(30);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

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

    const matchedArtists = ARTISTS_CATALOG.filter((a) =>
      a.name.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedAlbums = ALBUMS_CATALOG.filter(
      (alb) =>
        alb.title.toLowerCase().includes(q) || alb.artistName.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedTracks = TRACKS_CATALOG.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.albumTitle.toLowerCase().includes(q)
    ).slice(0, 8);

    return {
      artists: matchedArtists,
      albums: matchedAlbums,
      tracks: matchedTracks,
    };
  }, [searchQuery]);

  return (
    <div className="space-y-4 pb-8">
      {/* Search & Mode Bar */}
      <div className="space-y-3">
        {/* Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMode('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              mode === 'history'
                ? `${theme.primaryBg} text-white shadow-xs`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Listening History</span>
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              mode === 'search'
                ? `${theme.primaryBg} text-white shadow-xs`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Deep Search</span>
          </button>
        </div>

        {/* Search Input Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mode === 'search'
                ? 'Search artists, albums, tracks...'
                : 'Filter history by track or artist...'
            }
            className="w-full bg-slate-900/90 text-sm text-white placeholder-slate-500 pl-10 pr-9 py-2.5 rounded-2xl border border-slate-800 focus:outline-hidden focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Date Filters for History */}
        {mode === 'history' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { label: 'All Dates', value: '' },
              { label: 'Today (Oct 4)', value: '2026-10-04' },
              { label: 'Yesterday (Oct 3)', value: '2026-10-03' },
              { label: 'Sep 29 (Peak)', value: '2026-09-29' },
              { label: 'September', value: '2026-09' },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setDateFilter(f.value)}
                className={`px-3 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap cursor-pointer transition-colors border ${
                  dateFilter === f.value
                    ? 'bg-slate-800 text-white border-slate-600 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEARCH MODE RESULTS */}
      {mode === 'search' && (
        <div className="space-y-4">
          {!searchResults ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Type at least 2 characters to search your music library.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Artists */}
              {searchResults.artists.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    Artists ({searchResults.artists.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {searchResults.artists.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => onSelectEntity({ type: 'artist', id: a.id })}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                      >
                        <ArtworkThumb src={a.artworkUrl} alt={a.name} sizeClass="w-9 h-9" roundedClass="rounded-full" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{a.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{a.primaryGenre}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {searchResults.albums.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    Albums ({searchResults.albums.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.albums.map((alb) => (
                      <div
                        key={alb.id}
                        onClick={() => onSelectEntity({ type: 'album', id: alb.id })}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ArtworkThumb src={alb.artworkUrl} alt={alb.title} sizeClass="w-10 h-10" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate">{alb.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{alb.artistName}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracks */}
              {searchResults.tracks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    Tracks ({searchResults.tracks.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.tracks.map((trk) => (
                      <div
                        key={trk.id}
                        onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-9 h-9" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{trk.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{trk.artistName}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY MODE STREAM */}
      {mode === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Showing {pagedScrobbles.length} of {filteredScrobbles.length} records</span>
            {dateFilter && <span className="text-blue-400">Date: {dateFilter}</span>}
          </div>

          <div className="divide-y divide-slate-800/60 rounded-2xl bg-slate-900/60 border border-slate-800/70 overflow-hidden">
            {pagedScrobbles.map((s) => {
              const trk = getTrackById(s.trackId);
              if (!trk) return null;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectEntity({ type: 'track', id: trk.id })}
                  className="flex items-center justify-between p-3 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ArtworkThumb src={trk.artworkUrl} alt={trk.title} sizeClass="w-10 h-10" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate group-hover:text-white font-display">
                        {trk.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {trk.artistName} · {trk.albumTitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0 ml-3">
                    <p className="text-xs font-semibold text-slate-200">
                      {formatTimeUTC(s.timestamp)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatDateHuman(s.dateKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {pageSize < filteredScrobbles.length && (
            <button
              onClick={() => setPageSize((prev) => prev + 30)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 font-mono transition-colors cursor-pointer"
            >
              Load Next 30 Scrobbles ({filteredScrobbles.length - pageSize} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
