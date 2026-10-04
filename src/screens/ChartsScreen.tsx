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
import { ArtworkThumb, TimeRangeSelector } from '../components/MobilePrimitives';
import { SelectedEntity } from '../components/EntityDetailSheet';
import { useTheme } from '../context/ThemeContext';

interface ChartsScreenProps {
  scrobbles: Scrobble[];
  onSelectEntity: (entity: SelectedEntity) => void;
  onLaunchStory: (periodPreset?: '2026' | '2025' | '12m' | '6m' | 'all') => void;
  accentColor?: AccentColor;
}

export const ChartsScreen: React.FC<ChartsScreenProps> = ({
  scrobbles,
  onSelectEntity,
  onLaunchStory,
}) => {
  const { tokens } = useTheme();
  const [period, setPeriod] = useState<TimeRangeFilter>('30d');
  const [clockMetric, setClockMetric] = useState<'plays' | 'duration'>('plays');
  const [useLocalTz, setUseLocalTz] = useState(true);

  // Expanded decade item
  const [selectedDecadeKey, setSelectedDecadeKey] = useState<string | null>('2020s');

  // Selected fingerprint dimension for explanation modal/card
  const [selectedDimension, setSelectedDimension] = useState<FingerprintDimension | null>(null);

  // Selected hour on the 24h clock
  const [selectedHour, setSelectedHour] = useState<HourClockItem | null>(null);

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
            <h2 className="text-base font-black text-app-primary font-display uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-5 h-5 text-accent" />
              <span>Advanced Analytics Charts</span>
            </h2>
            <p className="text-xs text-app-muted mt-0.5">
              Deep behavioral models from your Last.fm telemetry
            </p>
          </div>
        </div>

        {/* Global Period Selector */}
        <div className="flex items-center justify-between bg-app-card p-2 rounded-2xl border border-app">
          <span className="text-[11px] font-mono text-app-muted font-semibold px-1">Window:</span>
          <TimeRangeSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Empty State when no scrobbles recorded */}
      {scrobbles.length === 0 && (
        <div className="p-8 rounded-3xl bg-app-card border border-app text-center space-y-4 shadow-xl">
          <div
            style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto text-accent"
          >
            <PieChart className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-app-primary font-display">
              No Music Telemetry Recorded
            </h3>
            <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
              Connect your Last.fm account to compute your Music Ratio, Listening Fingerprint radar,
              Decade Distribution, and 24h Listening Clock.
            </p>
          </div>
        </div>
      )}

      {/* PROMINENT STORY ENTRY BANNER */}
      {scrobbles.length > 0 && (
        <div
          onClick={() => onLaunchStory('2026')}
          style={{ borderColor: tokens.accentBorder }}
          className="relative overflow-hidden rounded-3xl p-4.5 bg-gradient-to-r from-app-card via-app-subcard to-app-card border shadow-lg cursor-pointer group transition-all"
        >
          <div
            style={{ backgroundColor: tokens.accentSubtle }}
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none"
          />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <span
                style={{
                  backgroundColor: tokens.accentSubtle,
                  color: tokens.accentPrimary,
                  borderColor: tokens.accentBorder,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>CINEMATIC RECAP</span>
              </span>
              <h3 className="text-sm font-bold text-app-primary font-display group-hover:text-accent transition-colors">
                My Listening Story
              </h3>
              <p className="text-[11px] text-app-secondary">
                10-card interactive audiovisual journey of your music evolution
              </p>
            </div>

            <div
              style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0 ml-3"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: MUSIC RATIO (Concentric Rings & Diversity Metrics)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div>
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2 font-display">
              <Layers className="w-4 h-4 text-accent" />
              <span>Music Ratio</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              Unique entity distribution vs. previous {period} period
            </p>
          </div>
          <span
            style={{
              backgroundColor: tokens.accentSubtle,
              color: tokens.accentPrimary,
              borderColor: tokens.accentBorder,
            }}
            className="text-[11px] font-mono px-2 py-0.5 rounded-md border"
          >
            {ratioReport.catalogBreadthRating} Breadth
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
                stroke={tokens.bgCardSub}
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke={tokens.chartPrimary}
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
                stroke={tokens.bgCardSub}
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="52"
                fill="none"
                stroke={tokens.chartSecondary}
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
                stroke={tokens.bgCardSub}
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="36"
                fill="none"
                stroke={tokens.chartTertiary}
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
              <span className="text-[10px] font-mono text-app-muted uppercase tracking-widest">
                Ratio
              </span>
              <span className="text-xl font-black font-mono text-app-primary">
                {ratioReport.tracksPerArtist}
              </span>
              <span className="text-[9px] text-app-muted font-mono">trk / art</span>
            </div>
          </div>

          {/* 3 Metric Cards with Delta */}
          <div className="w-full flex-1 space-y-2.5">
            {/* Tracks Metric */}
            <div className="p-3 rounded-2xl bg-app-subcard border border-app flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{ backgroundColor: tokens.chartPrimary }}
                  className="w-2.5 h-2.5 rounded-full shadow-xs"
                />
                <div>
                  <p className="text-xs font-bold text-app-secondary">Unique Tracks</p>
                  <p className="text-[11px] text-app-muted font-mono">
                    vs. {ratioReport.tracks.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-app-primary">
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
            <div className="p-3 rounded-2xl bg-app-subcard border border-app flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{ backgroundColor: tokens.chartSecondary }}
                  className="w-2.5 h-2.5 rounded-full shadow-xs"
                />
                <div>
                  <p className="text-xs font-bold text-app-secondary">Unique Albums</p>
                  <p className="text-[11px] text-app-muted font-mono">
                    vs. {ratioReport.albums.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-app-primary">
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
            <div className="p-3 rounded-2xl bg-app-subcard border border-app flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{ backgroundColor: tokens.chartTertiary }}
                  className="w-2.5 h-2.5 rounded-full shadow-xs"
                />
                <div>
                  <p className="text-xs font-bold text-app-secondary">Unique Artists</p>
                  <p className="text-[11px] text-app-muted font-mono">
                    vs. {ratioReport.artists.previous} last period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-app-primary">
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
        <div className="p-3 rounded-xl bg-app-subcard border border-app text-xs text-app-secondary leading-relaxed font-mono flex items-start gap-2">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>{ratioReport.summaryStatement}</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: LISTENING FINGERPRINT (Pentagon Radar & Dimension Drilldown)
          ========================================================================= */}
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div>
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2 font-display">
              <Radar className="w-4 h-4 text-accent" />
              <span>Listening Fingerprint</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              5-dimensional radar mapping listening habits
            </p>
          </div>
          <span
            style={{
              backgroundColor: tokens.accentSubtle,
              color: tokens.accentPrimary,
              borderColor: tokens.accentBorder,
            }}
            className="text-[11px] font-mono px-2 py-0.5 rounded-md border font-bold"
          >
            {fingerprintReport.archetype}
          </span>
        </div>

        {fingerprintReport.isUniform && (
          <div className="p-4 text-center text-xs text-app-muted bg-app-subcard rounded-2xl border border-app">
            Insufficient listening diversity in this time period to construct a distinctive
            fingerprint.
          </div>
        )}

        {!fingerprintReport.isUniform && (
          <div className="space-y-4">
            {/* SVG Radar Chart */}
            <div className="relative w-full max-w-[280px] h-[250px] mx-auto flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 280 250">
                <defs>
                  <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={tokens.chartPrimary} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={tokens.chartSecondary} stopOpacity="0.15" />
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
                      stroke={tokens.chartGrid}
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
                      stroke={tokens.chartGrid}
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
                        stroke={tokens.chartPrimary}
                        strokeWidth="2.5"
                      />
                      {pts.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={selectedDimension?.id === p.dim.id ? '5.5' : '4'}
                          fill={tokens.chartPrimary}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-all hover:r-6"
                          onClick={() => setSelectedDimension(p.dim)}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* Dimension Axis Labels */}
                {fingerprintReport.dimensions.map((d, i) => {
                  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                  const dist = 112;
                  const x = 140 + dist * Math.cos(angle);
                  const y = 125 + dist * Math.sin(angle);
                  const isSelected = selectedDimension?.id === d.id;

                  return (
                    <text
                      key={d.id}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isSelected ? tokens.accentPrimary : tokens.textSecondary}
                      fontSize="9"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                      className="cursor-pointer hover:font-bold select-none"
                      onClick={() => setSelectedDimension(isSelected ? null : d)}
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Dimension Selector Chips */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-mono text-app-muted uppercase font-semibold">
                Tap a dimension to view mathematical formula:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {fingerprintReport.dimensions.map((d) => {
                  const isSelected = selectedDimension?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDimension(isSelected ? null : d)}
                      style={{
                        backgroundColor: isSelected ? tokens.accentSubtle : undefined,
                        borderColor: isSelected ? tokens.accentBorder : undefined,
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-1 ring-accent'
                          : 'bg-app-subcard border-app hover:bg-app-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-app-secondary">{d.label}</span>
                        <span
                          style={{ color: tokens.accentPrimary }}
                          className="text-xs font-mono font-black"
                        >
                          {d.score}
                        </span>
                      </div>
                      <span className="text-[10px] text-app-muted block mt-0.5">
                        {d.shortDescription}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Dimension Explanation Card */}
            {selectedDimension && (
              <div
                style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
                className="p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <h4
                    style={{ color: tokens.accentPrimary }}
                    className="text-xs font-bold uppercase font-mono tracking-wider"
                  >
                    {selectedDimension.label} · Rating: {selectedDimension.rating} (
                    {selectedDimension.score}/100)
                  </h4>
                  <button
                    onClick={() => setSelectedDimension(null)}
                    className="text-app-muted hover:text-app-primary text-xs font-mono cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-app-secondary font-sans leading-relaxed">
                  {selectedDimension.formulaExplanation}
                </p>
                <div className="text-[11px] font-mono text-app-primary bg-black/40 p-2.5 rounded-xl border border-white/10">
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
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div>
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2 font-display">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Music by Decade</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              Historical release era breakdown across catalog
            </p>
          </div>
          <span
            style={{
              backgroundColor: tokens.warningSubtle,
              color: tokens.warning,
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
            className="text-[11px] font-mono px-2 py-0.5 rounded-md border"
          >
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
                style={{
                  backgroundColor: isSelected ? tokens.accentSubtle : undefined,
                  borderColor: isSelected ? tokens.accentBorder : undefined,
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected ? 'shadow-md ring-1 ring-accent' : 'bg-app-subcard border-app hover:bg-app-hover'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-app-primary font-display flex items-center gap-1.5">
                    <span>{dec.label}</span>
                    {dec.topAlbum && (
                      <span className="text-[10px] font-mono text-app-muted font-normal">
                        · {dec.uniqueTracks} tracks
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-app-primary font-bold">{dec.scrobblesCount} plays</span>
                    <span className="text-app-muted font-semibold">({dec.percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${dec.percentage}%`,
                      backgroundColor: isSelected ? tokens.accentPrimary : tokens.chartSecondary,
                    }}
                  />
                </div>

                {/* Expanded Decade Highlights */}
                {isSelected && dec.topAlbum && (
                  <div className="mt-3 pt-2.5 border-t border-app flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5">
                      <ArtworkThumb
                        src={dec.topAlbum.artworkUrl}
                        alt={dec.topAlbum.title}
                        sizeClass="w-9 h-9"
                        roundedClass="rounded-lg"
                      />
                      <div>
                        <p className="text-[11px] font-bold text-app-primary truncate">
                          {dec.topAlbum.title}
                        </p>
                        <p className="text-[10px] text-app-muted truncate">
                          {dec.topAlbum.artistName} ({dec.topAlbum.releaseYear})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity({ type: 'album', id: dec.topAlbum!.id });
                      }}
                      className="px-2 py-1 rounded-lg bg-app-card hover:bg-app-hover border border-app text-[10px] font-mono text-app-primary flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3 text-app-muted" />
                    </button>
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
      <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-app pb-3">
          <div>
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2 font-display">
              <Clock className="w-4 h-4 text-accent" />
              <span>Listening Clock</span>
            </h3>
            <p className="text-[11px] text-app-muted mt-0.5">
              24-hour circular circadian dial (00 to 23 hours)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-app-subcard p-1 rounded-xl border border-app text-[11px] font-mono">
            <button
              onClick={() => setClockMetric('plays')}
              style={{
                backgroundColor: clockMetric === 'plays' ? tokens.accentPrimary : 'transparent',
                color: clockMetric === 'plays' ? tokens.accentContrast : tokens.textMuted,
              }}
              className="px-2 py-0.5 rounded-lg transition-colors cursor-pointer font-bold"
            >
              Plays
            </button>
            <button
              onClick={() => setClockMetric('duration')}
              style={{
                backgroundColor: clockMetric === 'duration' ? tokens.accentPrimary : 'transparent',
                color: clockMetric === 'duration' ? tokens.accentContrast : tokens.textMuted,
              }}
              className="px-2 py-0.5 rounded-lg transition-colors cursor-pointer font-bold"
            >
              Time
            </button>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-app-subcard border border-app">
            <span className="text-[10px] font-mono uppercase text-app-muted">Busiest Hour</span>
            <p style={{ color: tokens.accentPrimary }} className="text-base font-bold font-mono mt-0.5">
              {clockReport.busiestHour.hourLabel}
            </p>
            <span className="text-[11px] text-app-muted font-mono">
              {clockReport.busiestHour.scrobblesCount} scrobbles recorded
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-app-subcard border border-app">
            <span className="text-[10px] font-mono uppercase text-app-muted">Quietest Period</span>
            <p className="text-base font-bold font-mono text-app-secondary mt-0.5">
              {clockReport.quietestPeriodLabel}
            </p>
            <span className="text-[11px] text-app-muted font-mono">
              Minimal scrobble activity
            </span>
          </div>
        </div>

        {/* Circular 24-Hour Clock Graphic */}
        <div className="relative w-full max-w-[280px] h-[280px] mx-auto flex items-center justify-center py-2">
          <svg className="w-full h-full" viewBox="0 0 280 280">
            {/* Center Dial Face */}
            <circle cx="140" cy="140" r="120" fill={tokens.bgCardSub} stroke={tokens.borderCard} strokeWidth="2" />
            <circle cx="140" cy="140" r="60" fill={tokens.bgApp} stroke={tokens.borderCardSub} strokeWidth="1.5" />

            {/* 24 Radial Hour Bars */}
            {clockReport.hours.map((hItem) => {
              const angleDeg = -90 + hItem.hour * 15;
              const angleRad = (angleDeg * Math.PI) / 180;

              const isBusiest = hItem.hour === clockReport.busiestHour.hour;
              const isSelected = selectedHour?.hour === hItem.hour;

              const barLen = 10 + (hItem.intensityPercent / 100) * 45;
              const x1 = 140 + 65 * Math.cos(angleRad);
              const y1 = 140 + 65 * Math.sin(angleRad);
              const x2 = 140 + (65 + barLen) * Math.cos(angleRad);
              const y2 = 140 + (65 + barLen) * Math.sin(angleRad);

              let strokeColor = tokens.chartGrid;
              if (isSelected) strokeColor = tokens.accentPrimary;
              else if (isBusiest) strokeColor = tokens.chartSecondary;
              else if (hItem.intensityPercent > 50) strokeColor = tokens.accentHover;
              else if (hItem.intensityPercent > 20) strokeColor = tokens.accentSubtle;

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
                </g>
              );
            })}

            {/* Dial Hour Numbers at 0, 6, 12, 18 */}
            {[
              { label: '00', x: 140, y: 32 },
              { label: '06', x: 250, y: 144 },
              { label: '12', x: 140, y: 258 },
              { label: '18', x: 30, y: 144 },
            ].map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={tokens.textMuted}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {p.label}
              </text>
            ))}

            {/* Center Dial Hub Details */}
            <text
              x="140"
              y="130"
              textAnchor="middle"
              dominantBaseline="central"
              fill={tokens.textMuted}
              fontSize="9"
              fontFamily="monospace"
            >
              SELECTED
            </text>
            <text
              x="140"
              y="146"
              textAnchor="middle"
              dominantBaseline="central"
              fill={tokens.accentPrimary}
              fontSize="16"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {selectedHour ? selectedHour.hourLabel : clockReport.busiestHour.hourLabel}
            </text>
            <text
              x="140"
              y="160"
              textAnchor="middle"
              dominantBaseline="central"
              fill={tokens.textSecondary}
              fontSize="9"
              fontFamily="monospace"
            >
              {selectedHour ? `${selectedHour.scrobblesCount} plays` : ''}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
