import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Sparkles,
  Flame,
  Clock,
  Compass,
  Radar,
  Disc3,
  Calendar,
  Layers,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { AccentColor, Scrobble } from '../types/music';
import { getStoryData, ListeningStoryData } from '../domain/analyticsEngine';
import { ArtworkThumb } from './MobilePrimitives';
import { useTheme } from '../context/ThemeContext';

interface ListeningStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrobbles: Scrobble[];
  initialPeriodPreset?: '2026' | '2025' | '12m' | '6m' | 'all';
  accentColor?: AccentColor;
}

export const ListeningStoryModal: React.FC<ListeningStoryModalProps> = ({
  isOpen,
  onClose,
  scrobbles,
  initialPeriodPreset = '2026',
}) => {
  const { tokens } = useTheme();
  const [periodPreset, setPeriodPreset] = useState<'2026' | '2025' | '12m' | '6m' | 'all'>(
    initialPeriodPreset
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const storyData: ListeningStoryData = useMemo(() => {
    return getStoryData(scrobbles, periodPreset);
  }, [scrobbles, periodPreset]);

  const TOTAL_CARDS = 10;

  // Auto-advance timer (5.5 seconds per card when not paused)
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setTimeout(() => {
      if (currentCardIndex < TOTAL_CARDS - 1) {
        setCurrentCardIndex((prev) => prev + 1);
      }
    }, 5500);

    return () => clearTimeout(timer);
  }, [isOpen, isPaused, currentCardIndex]);

  // Reset card index when preset changes
  const handlePeriodChange = (p: '2026' | '2025' | '12m' | '6m' | 'all') => {
    setPeriodPreset(p);
    setCurrentCardIndex(0);
  };

  const handleNext = () => {
    if (currentCardIndex < TOTAL_CARDS - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    const text = `My ${storyData.periodLabel} on ScrobbleX:\n🎵 ${storyData.intro.totalScrobbles.toLocaleString()} scrobbles\n⏱️ ${storyData.intro.totalDurationFormatted} listening\n🎨 ${storyData.fingerprint.archetype}\n#ScrobbleX`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const handleExportStory = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(storyData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `scrobblex_story_${storyData.periodPreset}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Container Device Frame */}
      <div
        style={{
          backgroundColor: tokens.bgApp,
          borderColor: tokens.borderCard,
        }}
        className="w-full max-w-md h-full sm:h-[92vh] sm:max-h-[850px] sm:rounded-3xl border flex flex-col overflow-hidden relative shadow-2xl select-none"
      >
        {/* Subtle Accent Glow In Background */}
        <div
          style={{ backgroundColor: tokens.accentSubtle }}
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-60"
        />

        {/* TOP CONTROLS BAR: 10 Segment Progress Bars */}
        <div className="px-4 pt-4 pb-2 z-30 space-y-2">
          {/* 10 Segmented Progress Trackers */}
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_CARDS }).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
                onClick={() => setCurrentCardIndex(idx)}
              >
                <div
                  style={{
                    backgroundColor:
                      idx < currentCardIndex
                        ? '#FFFFFF'
                        : idx === currentCardIndex
                        ? tokens.accentPrimary
                        : 'transparent',
                  }}
                  className={`h-full transition-all duration-300 ${
                    idx === currentCardIndex ? 'w-full animate-pulse' : idx < currentCardIndex ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Story Sub-Header */}
          <div className="flex items-center justify-between pt-1">
            {/* Period Selector Pills */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-[10px] font-mono">
              {(
                [
                  { id: '2026', label: '2026' },
                  { id: '2025', label: '2025' },
                  { id: '12m', label: '12M' },
                  { id: '6m', label: '6M' },
                ] as const
              ).map((p) => {
                const isSelected = periodPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePeriodChange(p.id)}
                    style={{
                      backgroundColor: isSelected ? tokens.accentPrimary : 'transparent',
                      color: isSelected ? tokens.accentContrast : tokens.textMuted,
                    }}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'font-bold' : 'hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close Story"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP NAVIGATION ZONES (Left 30% / Right 70%) */}
        <div
          className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-16 right-0 w-2/3 z-20 cursor-pointer"
          onClick={handleNext}
        />

        {/* Copy Notification Live Toast */}
        {copiedNotification && (
          <div
            style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
            className="absolute top-16 inset-x-8 py-2 px-4 rounded-xl text-xs font-mono text-center z-40 shadow-xl"
          >
            Story summary copied to clipboard!
          </div>
        )}

        {/* Empty state when no data in period */}
        {scrobbles.length === 0 ? (
          <div className="flex-1 px-6 py-12 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div
              style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
              className="w-16 h-16 rounded-3xl border flex items-center justify-center text-accent"
            >
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-app-primary font-display">
                No Scrobbles Recorded
              </h3>
              <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
                Connect your Last.fm account and synchronize scrobbles to unlock your 10-card
                audiovisual listening story.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-app-card hover:bg-app-hover text-app-primary font-bold text-xs cursor-pointer border border-app"
            >
              Close Story
            </button>
          </div>
        ) : (
          /* STORY CARD CONTENT CONTAINER */
          <div className="flex-1 px-6 py-6 flex flex-col justify-between overflow-y-auto no-scrollbar relative z-10">
            {/* CARD 1 — INTRO */}
            {currentCardIndex === 0 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
                <div className="space-y-2">
                  <span
                    style={{
                      backgroundColor: tokens.accentSubtle,
                      color: tokens.accentPrimary,
                      borderColor: tokens.accentBorder,
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>SCROBBLEX PRESENTS</span>
                  </span>
                  <h1 className="text-3xl font-black text-app-primary font-display tracking-tight mt-2">
                    My Listening Story
                  </h1>
                  <p className="text-xs text-app-muted font-mono">
                    {storyData.intro.periodLabel} · Deterministic Audio Telemetry
                  </p>
                </div>

                {/* Big Animated Stats */}
                <div className="space-y-4 my-auto">
                  <div className="p-6 rounded-3xl bg-app-card border border-app text-center space-y-1 shadow-2xl">
                    <span className="text-xs font-mono uppercase text-app-muted font-bold tracking-widest">
                      Total Scrobbles
                    </span>
                    <p className="text-5xl font-black font-mono text-app-primary tracking-tight">
                      {storyData.intro.totalScrobbles.toLocaleString()}
                    </p>
                    <span className="text-xs text-app-muted font-mono">
                      ~{storyData.intro.dailyAverage} tracks / day
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3.5 rounded-2xl bg-app-subcard border border-app">
                      <span className="text-[10px] font-mono uppercase text-app-muted">Time</span>
                      <p style={{ color: tokens.chartPrimary }} className="text-lg font-bold font-mono mt-0.5">
                        {storyData.intro.totalDurationFormatted}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-app-subcard border border-app">
                      <span className="text-[10px] font-mono uppercase text-app-muted">Artists</span>
                      <p style={{ color: tokens.chartSecondary }} className="text-lg font-bold font-mono mt-0.5">
                        {storyData.intro.totalArtists}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-app-subcard border border-app">
                      <span className="text-[10px] font-mono uppercase text-app-muted">Tracks</span>
                      <p style={{ color: tokens.chartTertiary }} className="text-lg font-bold font-mono mt-0.5">
                        {storyData.intro.totalTracks}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-app-muted font-mono">
                  Tap right to begin your recap ➔
                </div>
              </div>
            )}

            {/* CARD 2 — YOUR MUSIC */}
            {currentCardIndex === 1 && storyData.music && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 02 / 10 · Core Catalog
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Your Signature Music
                  </h2>
                </div>

                <div className="space-y-3.5 my-auto">
                  {/* Top Artist Showcase */}
                  <div className="p-4 rounded-3xl bg-app-card border border-app flex items-center gap-4 shadow-xl">
                    <ArtworkThumb
                      src={storyData.music.topArtist.artworkUrl}
                      alt={storyData.music.topArtist.name}
                      sizeClass="w-16 h-16"
                      roundedClass="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: tokens.chartSecondary }} className="text-[10px] font-mono uppercase font-bold">
                        Top Artist
                      </span>
                      <h3 className="text-lg font-bold text-app-primary truncate font-display">
                        {storyData.music.topArtist.name}
                      </h3>
                      <p className="text-xs text-app-secondary font-mono">
                        {storyData.music.topArtist.plays} plays ({storyData.music.topArtist.sharePercent}% share)
                      </p>
                    </div>
                  </div>

                  {/* Top Track Showcase */}
                  <div className="p-4 rounded-3xl bg-app-card border border-app flex items-center gap-4 shadow-xl">
                    <ArtworkThumb
                      src={storyData.music.topTrack.artworkUrl}
                      alt={storyData.music.topTrack.name}
                      sizeClass="w-16 h-16"
                      roundedClass="rounded-2xl"
                    />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: tokens.chartPrimary }} className="text-[10px] font-mono uppercase font-bold">
                        Top Track
                      </span>
                      <h3 className="text-base font-bold text-app-primary truncate font-display">
                        {storyData.music.topTrack.name}
                      </h3>
                      <p className="text-xs text-app-secondary truncate">
                        {storyData.music.topTrack.subtitle} · {storyData.music.topTrack.plays} plays
                      </p>
                    </div>
                  </div>

                  {/* Top Album Showcase */}
                  <div className="p-4 rounded-3xl bg-app-card border border-app flex items-center gap-4 shadow-xl">
                    <ArtworkThumb
                      src={storyData.music.topAlbum.artworkUrl}
                      alt={storyData.music.topAlbum.name}
                      sizeClass="w-16 h-16"
                      roundedClass="rounded-2xl"
                    />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: tokens.chartTertiary }} className="text-[10px] font-mono uppercase font-bold">
                        Top Album
                      </span>
                      <h3 className="text-base font-bold text-app-primary truncate font-display">
                        {storyData.music.topAlbum.name}
                      </h3>
                      <p className="text-xs text-app-secondary truncate">
                        {storyData.music.topAlbum.subtitle} · {storyData.music.topAlbum.plays} plays
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Derived directly from your synchronized scrobble count
                </p>
              </div>
            )}

            {/* CARD 3 — YOUR LISTENING ACTIVITY */}
            {currentCardIndex === 2 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 03 / 10 · Cadence
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Listening Activity
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 my-auto">
                  <div className="p-4 rounded-3xl bg-app-card border border-app space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Total Hours</span>
                    <p className="text-2xl font-black font-mono text-app-primary">
                      {storyData.activity.totalHours} hrs
                    </p>
                    <span className="text-[11px] text-app-muted">Continuous playback</span>
                  </div>

                  <div className="p-4 rounded-3xl bg-app-card border border-app space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Longest Streak</span>
                    <p className="text-2xl font-black font-mono text-amber-400 flex items-center gap-1">
                      <Flame className="w-5 h-5 fill-current" />
                      <span>{storyData.activity.longestStreakDays}d</span>
                    </p>
                    <span className="text-[11px] text-app-muted">Consecutive days</span>
                  </div>

                  <div className="p-4 rounded-3xl bg-app-card border border-app space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Peak Month</span>
                    <p style={{ color: tokens.chartTertiary }} className="text-lg font-bold">
                      {storyData.activity.mostActiveMonth}
                    </p>
                    <span className="text-[11px] text-app-muted">Highest volume</span>
                  </div>

                  <div className="p-4 rounded-3xl bg-app-card border border-app space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Busiest Hour</span>
                    <p style={{ color: tokens.chartPrimary }} className="text-lg font-bold">
                      {storyData.activity.busiestHourLabel}
                    </p>
                    <span className="text-[11px] text-app-muted">Circadian peak</span>
                  </div>

                  <div className="col-span-2 p-4 rounded-3xl bg-app-card border border-app">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Busiest Day Record</span>
                    <p className="text-base font-bold text-app-primary mt-1">
                      {storyData.activity.busiestDayFormatted} ({storyData.activity.busiestDayPlays} scrobbles)
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Tracked accurately with daily calendar logs
                </p>
              </div>
            )}

            {/* CARD 4 — YOUR LISTENING FINGERPRINT */}
            {currentCardIndex === 3 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 04 / 10 · Dimensions
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Listening Fingerprint
                  </h2>
                </div>

                <div className="space-y-4 my-auto">
                  <div
                    style={{ backgroundColor: tokens.accentSubtle, borderColor: tokens.accentBorder }}
                    className="p-4 rounded-3xl border text-center space-y-1"
                  >
                    <span
                      style={{ color: tokens.accentPrimary }}
                      className="text-[10px] font-mono uppercase font-bold tracking-widest"
                    >
                      Your Archetype
                    </span>
                    <h3 className="text-2xl font-black text-app-primary font-display">
                      {storyData.fingerprint.archetype}
                    </h3>
                  </div>

                  {/* 5 Dimension Progress Bars */}
                  <div className="space-y-2.5 p-4 rounded-3xl bg-app-card border border-app">
                    {storyData.fingerprint.dimensions.map((dim) => (
                      <div key={dim.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-app-secondary">{dim.label}</span>
                          <span style={{ color: tokens.accentPrimary }} className="font-bold">
                            {dim.score} / 100
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div
                            style={{
                              width: `${dim.score}%`,
                              backgroundColor: tokens.accentPrimary,
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Mathematical behavioral radar analysis
                </p>
              </div>
            )}

            {/* CARD 5 — ERA & DECADES */}
            {currentCardIndex === 4 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 05 / 10 · Eras
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Music Through the Eras
                  </h2>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="p-4 rounded-3xl bg-app-card border border-app text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted">Dominant Decade</span>
                    <h3 style={{ color: tokens.accentPrimary }} className="text-3xl font-black font-display">
                      {storyData.decades.topDecadeLabel}
                    </h3>
                    <p className="text-xs text-app-muted font-mono">
                      {storyData.decades.topDecadePercent}% of all plays in {storyData.periodLabel}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {storyData.decades.bars.slice(0, 4).map((d) => (
                      <div key={d.label} className="p-3 rounded-2xl bg-app-subcard border border-app space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-app-primary font-bold">{d.label}</span>
                          <span className="text-app-muted">{d.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div
                            style={{
                              width: `${d.percentage}%`,
                              backgroundColor: tokens.chartSecondary,
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Catalog era distribution
                </p>
              </div>
            )}

            {/* CARD 6 — MUSIC RATIO */}
            {currentCardIndex === 5 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 06 / 10 · Breadth
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Your Music Ratio
                  </h2>
                </div>

                <div className="p-6 rounded-3xl bg-app-card border border-app text-center space-y-3 my-auto shadow-xl">
                  <span className="text-[10px] font-mono uppercase text-app-muted tracking-widest">
                    Tracks per Artist
                  </span>
                  <p className="text-5xl font-black font-mono text-app-primary">
                    {storyData.ratio.ratioValue}
                  </p>
                  <div
                    style={{ backgroundColor: tokens.accentSubtle, color: tokens.accentPrimary }}
                    className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold"
                  >
                    {storyData.ratio.breadthRating} Explorer
                  </div>
                  <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed pt-2">
                    {storyData.ratio.statement}
                  </p>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Listening breadth ratio index
                </p>
              </div>
            )}

            {/* CARD 7 — REDISCOVERY */}
            {currentCardIndex === 6 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 07 / 10 · Gems
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Rediscovered Favorites
                  </h2>
                </div>

                <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 my-auto shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <ArtworkThumb
                      src={storyData.rediscover.topCandidate.artworkUrl}
                      alt={storyData.rediscover.topCandidate.title}
                      sizeClass="w-16 h-16"
                      roundedClass="rounded-2xl"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                        Forgotten Gem
                      </span>
                      <h3 className="text-base font-bold text-app-primary truncate font-display">
                        {storyData.rediscover.topCandidate.title}
                      </h3>
                      <p className="text-xs text-app-muted truncate">
                        {storyData.rediscover.topCandidate.artistName}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-app-subcard text-xs font-mono text-app-secondary border border-app">
                    {storyData.rediscover.topCandidate.evidence}
                  </div>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Algorithmic dormancy detection
                </p>
              </div>
            )}

            {/* CARD 8 — INTEGRITY & TRUST */}
            {currentCardIndex === 7 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 08 / 10 · Audit
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Listening Integrity
                  </h2>
                </div>

                <div className="p-6 rounded-3xl bg-app-card border border-app text-center space-y-3 my-auto shadow-xl">
                  <span className="text-[10px] font-mono uppercase text-app-muted tracking-widest">
                    Organic Trust Score
                  </span>
                  <p style={{ color: tokens.accentPrimary }} className="text-5xl font-black font-mono">
                    {storyData.trust.score} / 100
                  </p>
                  <p className="text-sm font-bold text-app-primary">
                    {storyData.trust.verdict}
                  </p>
                  <p className="text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
                    Zero duplicate inflation detected. Continuous natural playback patterns verified.
                  </p>
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Mathematical listening integrity check
                </p>
              </div>
            )}

            {/* CARD 9 — TOP 5 LEADERBOARD */}
            {currentCardIndex === 8 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 09 / 10 · Hierarchy
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Top 5 Artists
                  </h2>
                </div>

                <div className="space-y-2 my-auto">
                  {storyData.topArtists.slice(0, 5).map((art, idx) => (
                    <div
                      key={art.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-app-card border border-app"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          style={{ color: idx === 0 ? tokens.accentPrimary : tokens.textMuted }}
                          className="font-mono text-sm font-black w-4 text-center"
                        >
                          {idx + 1}
                        </span>
                        <ArtworkThumb src={art.artworkUrl} alt={art.name} sizeClass="w-10 h-10" roundedClass="rounded-full" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-app-primary truncate font-display">
                            {art.name}
                          </p>
                          <p className="text-[10px] text-app-muted truncate font-mono">
                            {art.plays} plays
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-app-secondary">
                        {art.sharePercent}%
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] font-mono text-app-muted text-center">
                  Your most-streamed artists of {storyData.periodLabel}
                </p>
              </div>
            )}

            {/* CARD 10 — SUMMARY & SHARE */}
            {currentCardIndex === 9 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
                <div>
                  <span style={{ color: tokens.accentPrimary }} className="text-[11px] font-mono uppercase font-bold">
                    Card 10 / 10 · Summary
                  </span>
                  <h2 className="text-2xl font-black text-app-primary font-display mt-0.5">
                    Your {storyData.periodLabel} Story
                  </h2>
                </div>

                <div className="p-5 rounded-3xl bg-app-card border border-app space-y-4 my-auto shadow-2xl">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase text-app-muted font-bold tracking-widest">
                      Total Listening
                    </span>
                    <p className="text-4xl font-black font-mono text-app-primary">
                      {storyData.intro.totalScrobbles.toLocaleString()}
                    </p>
                    <p className="text-xs text-app-secondary font-mono">
                      {storyData.intro.totalDurationFormatted}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-app-subcard border border-app">
                      <span className="text-[9px] font-mono uppercase text-app-muted">Top Artist</span>
                      <p className="font-bold text-app-primary truncate mt-0.5">
                        {storyData.music.topArtist.name}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-app-subcard border border-app">
                      <span className="text-[9px] font-mono uppercase text-app-muted">Top Track</span>
                      <p className="font-bold text-app-primary truncate mt-0.5">
                        {storyData.music.topTrack.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share / Export Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleShare}
                    style={{ backgroundColor: tokens.accentPrimary, color: tokens.accentContrast }}
                    className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share My Story Recap</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportStory}
                      className="flex-1 py-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app text-xs font-mono text-app-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Story JSON</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl bg-app-card hover:bg-app-hover border border-app text-xs font-mono text-app-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Close Story</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
