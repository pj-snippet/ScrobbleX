import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Radar,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Disc,
  User2,
  Music2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCw,
} from 'lucide-react';
import {
  AccentColor,
  Scrobble,
  TimeRangeFilter,
} from '../types/music';
import {
  DecadeItem,
  FingerprintDimension,
  HourClockItem,
  getListeningClock,
  getListeningFingerprint,
  getMusicByDecade,
  getMusicRatio,
} from '../domain/analyticsEngine';
import { ACCENT_THEMES } from '../domain/themeConfig';
import { ArtworkThumb, TimeRangeSelector } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';

interface ChartsScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  onLaunchStory: (periodPreset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
  accentColor: AccentColor;
}

export const ChartsScreen: React.FC<ChartsScreenProps> = ({
  scrobbles,
  onSelectEntity,
  onLaunchStory,
  accentColor,
}) => {
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [clockMetric, setClockMetric] = useState<'plays' | 'duration'>('plays');
  const [useLocalTz, setUseLocalTz] = useState(true);

  // Expanded decade item
  const [selectedDecadeKey, setSelectedDecadeKey] = useState<string | null>('2020s');

  // Selected fingerprint dimension for explanation modal/card
  const [selectedDimension, setSelectedDimension] = useState<FingerprintDimension | null>(null);

  // Selected hour on the 24h clock
  const [selectedHour, setSelectedHour] = useState<HourClockItem | null>(null);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  // Centralized calculations
  const ratioReport = useMemo(() => getMusicRatio(scrobbles, period), [scrobbles, period]);
  const fingerprintReport = useMemo(() => getListeningFingerprint(scrobbles, period), [scrobbles, period]);
  const decadeReport = useMemo(() => getMusicByDecade(scrobbles, period), [scrobbles, period]);
  const clockReport = useMemo(
    () => getListeningClock(scrobbles, period, clockMetric, useLocalTz),
    [scrobbles, period, clockMetric, useLocalTz]
  );

  // Set default selected hour to busiest hour when clock data loads
  React.useEffect(() => {
    if (clockReport.busiestHour) {
      setSelectedHour(clockReport.busiestHour);
    }
  }, [clockReport.busiestHour]);

  return (
    <div className="space-y-6 pb-12">
      {/* SCREEN HEADER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white font-display uppercase tracking-wider flex items-center gap-2">
              <PieChart className={`w-5 h-5 ${theme.primaryText}`} />
              <span>Advanced Analytics Charts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep behavioral models from your Last.fm telemetry
            </p>
          </div>
        </div>

        {/* Global Period Selector */}
        <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 font-semibold px-1">Window:</span>
          <TimeRangeSelector value={period} onChange={setPeriod} accentColor={accentColor} />
        </div>
      </div>

      {/* PROMINENT STORY ENTRY BANNER */}
      <div
        onClick={() => onLaunchStory('2026')}
        className="relative overflow-hidden rounded-3xl p-4.5 bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900 border border-blue-500/30 shadow-lg cursor-pointer group transition-all hover:border-blue-400/50"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>CINEMATIC RECAP</span>
            </span>
            <h3 className="text-sm font-bold text-white font-display group-hover:text-blue-200 transition-colors">
              My Listening Story
            </h3>
            <p className="text-[11px] text-slate-300">
              10-card interactive audiovisual journey of your music evolution
            </p>
          </div>

          <div
            className={`w-10 h-10 rounded-2xl ${theme.primaryBg} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0 ml-3`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: MUSIC RATIO (Concentric Rings & Diversity Metrics)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Music Ratio</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tracks, albums, and artist breadth vs. {ratioReport.previousPeriodLabel}
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            {ratioReport.periodLabel}
          </span>
        </div>

        {/* Concentric Rings Visualization */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* SVG Concentric Rings */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Outer Ring: Tracks (Radius 68) */}
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#1E293B"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="8"
                strokeDasharray="427"
                strokeDashoffset={Math.max(
                  30,
                  427 - (Math.min(100, ratioReport.tracks.current) / 100) * 427
                )}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Middle Ring: Albums (Radius 52) */}
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="#1E293B"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke="#A855F7"
                strokeWidth="8"
                strokeDasharray="326"
                strokeDashoffset={Math.max(
                  30,
                  326 - (Math.min(100, ratioReport.albums.current) / 100) * 326
                )}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Inner Ring: Artists (Radius 36) */}
              <circle
                cx="80"
                cy="80"
                r="36"
                fill="none"
                stroke="#1E293B"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="36"
                fill="none"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray="226"
                strokeDashoffset={Math.max(
                  25,
                  226 - (Math.min(100, ratioReport.artists.current) / 100) * 226
                )}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Ratio
              </span>
              <span className="text-xl font-black font-mono text-white">
                {ratioReport.tracksPerArtist}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">trk / art</span>
            </div>
          </div>

          {/* 3 Metric Cards with Delta */}
          <div className="w-full flex-1 space-y-2.5">
            {/* Tracks Metric */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-xs" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Unique Tracks</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    vs. {ratioReport.tracks.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-white">
                  {ratioReport.tracks.current}
                </span>
                <span
                  className={`block text-[10px] font-mono font-semibold ${
                    ratioReport.tracks.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {ratioReport.tracks.delta >= 0 ? '+' : ''}
                  {ratioReport.tracks.delta} ({ratioReport.tracks.deltaPercent}%)
                </span>
              </div>
            </div>

            {/* Albums Metric */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-xs" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Unique Albums</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    vs. {ratioReport.albums.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-white">
                  {ratioReport.albums.current}
                </span>
                <span
                  className={`block text-[10px] font-mono font-semibold ${
                    ratioReport.albums.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {ratioReport.albums.delta >= 0 ? '+' : ''}
                  {ratioReport.albums.delta} ({ratioReport.albums.deltaPercent}%)
                </span>
              </div>
            </div>

            {/* Artists Metric */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Unique Artists</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    vs. {ratioReport.artists.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-white">
                  {ratioReport.artists.current}
                </span>
                <span
                  className={`block text-[10px] font-mono font-semibold ${
                    ratioReport.artists.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {ratioReport.artists.delta >= 0 ? '+' : ''}
                  {ratioReport.artists.delta} ({ratioReport.artists.deltaPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>{ratioReport.summaryStatement}</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: LISTENING FINGERPRINT (Radar Chart with 5 Exact Dimensions)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Radar className="w-4 h-4 text-purple-400" />
              <span>Listening Fingerprint</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-dimensional behavioral profile (0–100 scale)
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
            {fingerprintReport.overallArchetype}
          </span>
        </div>

        {!fingerprintReport.hasEnoughData ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Info className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">{fingerprintReport.insufficientDataReason}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Radar Chart */}
            <div className="relative w-full max-w-[280px] h-[250px] mx-auto flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 280 250">
                <defs>
                  <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
                  </linearGradient>
                </defs>

                {/* Radar Grid Webs (20%, 40%, 60%, 80%, 100%) */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
                  const r = 90 * scale;
                  const cx = 140;
                  const cy = 125;
                  const points = [0, 1, 2, 3, 4]
                    .map((i) => {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                      const x = cx + r * Math.cos(angle);
                      const y = cy + r * Math.sin(angle);
                      return `${x},${y}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={scale}
                      points={points}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray={scale === 1.0 ? 'none' : '3 3'}
                      opacity={scale === 1.0 ? 0.7 : 0.4}
                    />
                  );
                })}

                {/* Axis lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                  const x = 140 + 90 * Math.cos(angle);
                  const y = 125 + 90 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1="140"
                      y1="125"
                      x2={x}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}

                {/* Data Polygon */}
                {(() => {
                  const cx = 140;
                  const cy = 125;
                  const pts = fingerprintReport.dimensions.map((d, i) => {
                    const r = (d.score / 100) * 90;
                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    return { x, y, score: d.score, label: d.label, dim: d };
                  });
                  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

                  return (
                    <>
                      <polygon
                        points={polyPoints}
                        fill="url(#radarGrad)"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                      />
                      {pts.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="4.5"
                          fill="#38BDF8"
                          stroke="#0C101B"
                          strokeWidth="2"
                          className="cursor-pointer hover:r-6 transition-all"
                          onClick={() => setSelectedDimension(p.dim)}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* Axis Labels */}
                {fingerprintReport.dimensions.map((d, i) => {
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                  const x = 140 + 114 * Math.cos(angle);
                  const y = 125 + 114 * Math.sin(angle);
                  return (
                    <text
                      key={d.id}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#94A3B8"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="600"
                      className="cursor-pointer hover:fill-white"
                      onClick={() => setSelectedDimension(d)}
                    >
                      {d.label.split(' ')[0]} ({d.score})
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Dimension Pills (Tappable for Explanation) */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Tap a dimension to view mathematical formula:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {fingerprintReport.dimensions.map((d) => {
                  const isSelected = selectedDimension?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDimension(isSelected ? null : d)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900/30 border-purple-500/50 ring-1 ring-purple-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{d.label}</span>
                        <span className="text-xs font-mono font-black text-purple-300">
                          {d.score}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {d.shortDescription}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Dimension Explanation Card */}
            {selectedDimension && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-200 uppercase font-mono tracking-wider">
                    {selectedDimension.label} · Rating: {selectedDimension.rating} ({selectedDimension.score}/100)
                  </h4>
                  <button
                    onClick={() => setSelectedDimension(null)}
                    className="text-slate-400 hover:text-white text-xs font-mono"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedDimension.formulaExplanation}
                </p>
                <div className="text-[11px] font-mono text-purple-300 bg-black/40 p-2.5 rounded-xl border border-purple-500/20">
                  Evidence: {selectedDimension.dataEvidence}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: MUSIC BY DECADE (Horizontal Bars & Top Album by Decade)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Music by Decade</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical release era breakdown across catalog
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {decadeReport.vintageSharePercent}% Pre-2000
          </span>
        </div>

        {/* Horizontal Bars List */}
        <div className="space-y-2.5">
          {decadeReport.decades.map((dec) => {
            const isSelected = selectedDecadeKey === dec.decadeKey;
            return (
              <div
                key={dec.decadeKey}
                onClick={() => setSelectedDecadeKey(isSelected ? null : dec.decadeKey)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-100 font-display flex items-center gap-1.5">
                    <span>{dec.label}</span>
                    {dec.topAlbum && (
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        · {dec.uniqueTracks} tracks
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">{dec.scrobblesCount} plays</span>
                    <span className="font-bold text-amber-400">{dec.percentage}%</span>
                    {isSelected ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Percentage Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, dec.percentage)}%` }}
                  />
                </div>

                {/* Expanded Decade Details */}
                {isSelected && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                    {/* Top Album Showcase */}
                    {dec.topAlbum && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-3">
                        <ArtworkThumb
                          src={dec.topAlbum.artworkUrl}
                          alt={dec.topAlbum.title}
                          sizeClass="w-12 h-12"
                          roundedClass="rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                            Top Album • {dec.label}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate font-display">
                            {dec.topAlbum.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {dec.topAlbum.artistName} · {dec.topAlbum.plays} plays
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Top Tracks from this decade */}
                    {dec.topTracks.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400">
                          Top Decade Tracks
                        </span>
                        <div className="divide-y divide-slate-800/60 rounded-xl bg-black/30 overflow-hidden">
                          {dec.topTracks.map((trk) => (
                            <div
                              key={trk.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEntity({ type: 'track', id: trk.id });
                              }}
                              className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-800/40"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-slate-200">{trk.title}</span>
                                <span className="text-slate-400 ml-1">· {trk.artistName}</span>
                              </div>
                              <span className="font-mono text-slate-400 shrink-0 ml-2">
                                {trk.plays}p
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: LISTENING CLOCK (24-Hour Circular Dial Visualization)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Listening Clock</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              24-hour circular circadian dial (00 to 23 hours)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setClockMetric('plays')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                clockMetric === 'plays' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Plays
            </button>
            <button
              onClick={() => setClockMetric('duration')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                clockMetric === 'duration' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Time
            </button>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Busiest Hour</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {clockReport.busiestHour.hourLabel}
            </p>
            <span className="text-[11px] text-slate-400 font-mono">
              {clockReport.busiestHour.scrobblesCount} scrobbles recorded
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">Quietest Period</span>
            <p className="text-base font-bold font-mono text-slate-300 mt-0.5">
              {clockReport.quietestPeriodLabel}
            </p>
            <span className="text-[11px] text-slate-500 font-mono">
              Minimal scrobble activity
            </span>
          </div>
        </div>

        {/* Circular 24-Hour Clock Graphic */}
        <div className="relative w-full max-w-[280px] h-[280px] mx-auto flex items-center justify-center py-2">
          <svg className="w-full h-full" viewBox="0 0 280 280">
            {/* Center Dial Face */}
            <circle cx="140" cy="140" r="120" fill="#0C101B" stroke="#1E293B" strokeWidth="2" />
            <circle cx="140" cy="140" r="60" fill="#07090E" stroke="#334155" strokeWidth="1.5" />

            {/* 24 Radial Hour Bars */}
            {clockReport.hours.map((hItem) => {
              // 24 hours -> 360 / 24 = 15 degrees each
              // 0 hours (midnight) at top (-90 degrees)
              const angleDeg = -90 + hItem.hour * 15;
              const angleRad = (angleDeg * Math.PI) / 180;

              const isBusiest = hItem.hour === clockReport.busiestHour.hour;
              const isSelected = selectedHour?.hour === hItem.hour;

              // Bar height proportional to intensity: from r=65 to r=115
              const barLen = 10 + (hItem.intensityPercent / 100) * 45;
              const x1 = 140 + 65 * Math.cos(angleRad);
              const y1 = 140 + 65 * Math.sin(angleRad);
              const x2 = 140 + (65 + barLen) * Math.cos(angleRad);
              const y2 = 140 + (65 + barLen) * Math.sin(angleRad);

              let strokeColor = '#334155';
              if (isSelected) strokeColor = '#38BDF8';
              else if (isBusiest) strokeColor = '#10B981';
              else if (hItem.intensityPercent > 50) strokeColor = '#06B6D4';
              else if (hItem.intensityPercent > 20) strokeColor = '#0284C7';

              return (
                <g key={hItem.hour} className="cursor-pointer" onClick={() => setSelectedHour(hItem)}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 5.5 : 3.5}
                    strokeLinecap="round"
                    className="transition-all hover:stroke-white"
                  />
                  {/* Hour tick marks at 0, 6, 12, 18 */}
                  {[0, 6, 12, 18].includes(hItem.hour) && (
                    <text
                      x={140 + 50 * Math.cos(angleRad)}
                      y={140 + 50 * Math.sin(angleRad)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {hItem.hour === 0 ? '12A' : hItem.hour === 12 ? '12P' : `${hItem.hour}`}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center Info Text */}
            <circle cx="140" cy="140" r="3" fill="#38BDF8" />
            {selectedHour ? (
              <g className="text-center">
                <text
                  x="140"
                  y="132"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {selectedHour.hourLabel}
                </text>
                <text
                  x="140"
                  y="148"
                  textAnchor="middle"
                  fill="#10B981"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {selectedHour.scrobblesCount} plays
                </text>
              </g>
            ) : (
              <text
                x="140"
                y="144"
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
              >
                24H CLOCK
              </text>
            )}
          </svg>
        </div>

        {/* Selected Hour Details Card */}
        {selectedHour && (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">
                {selectedHour.hourLabel} ({String(selectedHour.hour).padStart(2, '0')}:00–{String(selectedHour.hour).padStart(2, '0')}:59)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {selectedHour.scrobblesCount} scrobbles ({selectedHour.durationFormatted})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
              <div>
                <span className="text-slate-500 font-mono">Top Artist:</span>
                <p className="text-slate-200 font-semibold truncate">
                  {selectedHour.topArtist ? `${selectedHour.topArtist.name} (${selectedHour.topArtist.plays}p)` : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-mono">Top Track:</span>
                <p className="text-slate-200 font-semibold truncate">
                  {selectedHour.topTrack ? selectedHour.topTrack.title : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Narrative Circadian Summary */}
        <p className="text-xs font-mono text-slate-400 leading-relaxed px-1">
          {clockReport.circadianSummary}
        </p>
      </div>
    </div>
  );
};
