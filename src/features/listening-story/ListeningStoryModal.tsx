import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  Compass,
  Heart,
  TrendingUp,
  Layers,
  Calendar,
  Check,
} from 'lucide-react';
import { AccentColor, Scrobble } from '../../types/music';
import {
  ListeningStoryData,
  getStoryData,
} from '../analytics/services/analyticsEngine';
import { ACCENT_THEMES } from '../themes/themeRegistry';
import { ArtworkThumb } from '../../components/ui/MobilePrimitives';

const STORY_CARD_SEQUENCE = [0, 1, 2, 3, 5, 7, 8, 9] as const;

interface ListeningStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrobbles: Scrobble[];
  initialPeriodPreset?: '2026' | '2025' | '12m' | '6m' | 'all';
  accentColor: AccentColor;
}

export const ListeningStoryModal: React.FC<ListeningStoryModalProps> = ({
  isOpen,
  onClose,
  scrobbles,
  initialPeriodPreset = '2026',
  accentColor,
}) => {
  const [periodPreset, setPeriodPreset] = useState<'2026' | '2025' | '12m' | '6m' | 'all'>(
    initialPeriodPreset
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.blue;

  const storyData: ListeningStoryData = useMemo(() => {
    return getStoryData(scrobbles, periodPreset);
  }, [scrobbles, periodPreset]);

  const TOTAL_CARDS = STORY_CARD_SEQUENCE.length;
  const activeStoryCard = STORY_CARD_SEQUENCE[currentCardIndex];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Container simulating high-end mobile story canvas */}
      <div className="relative w-full max-w-md h-full sm:h-[94vh] sm:max-h-[880px] bg-gradient-to-b from-[#090D18] via-[#05070D] to-[#040508] sm:rounded-[40px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* TOP CONTROLS BAR: 10 Segment Progress Bars */}
        <div className="px-4 pt-4 pb-2 z-30 space-y-2">
          {/* 10 Segmented Progress Trackers */}
          <div className="flex items-center gap-1.5 w-full">
            {STORY_CARD_SEQUENCE.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden cursor-pointer"
                onClick={() => setCurrentCardIndex(idx)}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    idx < currentCardIndex
                      ? 'w-full bg-white'
                      : idx === currentCardIndex
                      ? 'w-full bg-blue-400 animate-pulse'
                      : 'w-0'
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
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    periodPreset === p.id
                      ? `${theme.primaryBg} text-white font-bold`
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
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
          className="absolute inset-y-16 left-0 w-[30%] z-20 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-16 right-0 w-[70%] z-20 cursor-pointer"
          onClick={handleNext}
        />

        {/* =========================================================================
            STORY CARD CONTENT CONTAINER
            ========================================================================= */}
        <div className="flex-1 px-6 py-6 flex flex-col justify-between overflow-y-auto no-scrollbar relative z-10">
          {/* =====================================================
              CARD 1 — INTRO
              ===================================================== */}
          {activeStoryCard === 0 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>SCROBBLEX PRESENTS</span>
                </span>
                <h1 className="text-3xl font-black text-white font-display tracking-tight mt-2">
                  My Listening Story
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  {storyData.intro.periodLabel} · Deterministic Audio Telemetry
                </p>
              </div>

              {/* Big Animated Stats */}
              <div className="space-y-4 my-auto">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-1 shadow-2xl">
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-widest">
                    Total Scrobbles
                  </span>
                  <p className="text-5xl font-black font-mono text-white tracking-tight">
                    {storyData.intro.totalScrobbles.toLocaleString()}
                  </p>
                  <span className="text-xs text-slate-400 font-mono">
                    ~{storyData.intro.dailyAverage} tracks / day
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Time</span>
                    <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {storyData.intro.totalDurationFormatted}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Artists</span>
                    <p className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                      {storyData.intro.totalArtists}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Tracks</span>
                    <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {storyData.intro.totalTracks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 font-mono">
                Tap right to begin your recap ➔
              </div>
            </div>
          )}

          {/* =====================================================
              CARD 2 — YOUR MUSIC
              ===================================================== */}
          {activeStoryCard === 1 && storyData.music && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-purple-400 font-bold">
                  Card 02 / 08 · Core Catalog
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Your Signature Music
                </h2>
              </div>

              <div className="space-y-3.5 my-auto">
                {/* Top Artist Showcase */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-purple-500/30 flex items-center gap-4 shadow-xl">
                  <ArtworkThumb
                    src={storyData.music.topArtist.artworkUrl}
                    alt={storyData.music.topArtist.name}
                    sizeClass="w-16 h-16"
                    roundedClass="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold text-purple-300">
                      Top Artist
                    </span>
                    <h3 className="text-lg font-bold text-white truncate font-display">
                      {storyData.music.topArtist.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono">
                      {storyData.music.topArtist.plays} plays ({storyData.music.topArtist.sharePercent}% share)
                    </p>
                  </div>
                </div>

                {/* Top Track Showcase */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-4 shadow-xl">
                  <ArtworkThumb
                    src={storyData.music.topTrack.artworkUrl}
                    alt={storyData.music.topTrack.name}
                    sizeClass="w-16 h-16"
                    roundedClass="rounded-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-300">
                      Top Track
                    </span>
                    <h3 className="text-base font-bold text-white truncate font-display">
                      {storyData.music.topTrack.name}
                    </h3>
                    <p className="text-xs text-slate-300 truncate">
                      {storyData.music.topTrack.subtitle} · {storyData.music.topTrack.plays} plays
                    </p>
                  </div>
                </div>

                {/* Top Album Showcase */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-4 shadow-xl">
                  <ArtworkThumb
                    src={storyData.music.topAlbum.artworkUrl}
                    alt={storyData.music.topAlbum.name}
                    sizeClass="w-16 h-16"
                    roundedClass="rounded-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-300">
                      Top Album
                    </span>
                    <h3 className="text-base font-bold text-white truncate font-display">
                      {storyData.music.topAlbum.name}
                    </h3>
                    <p className="text-xs text-slate-300 truncate">
                      {storyData.music.topAlbum.subtitle} · {storyData.music.topAlbum.plays} plays
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Derived directly from your synchronized scrobble count
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 3 — YOUR LISTENING ACTIVITY
              ===================================================== */}
          {activeStoryCard === 2 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
                  Card 03 / 08 · Cadence
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Listening Activity
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 my-auto">
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Listening Time</span>
                  <p className="text-2xl font-black font-mono text-white">
                    {storyData.activity.totalHours}
                  </p>
                  <span className="text-[11px] text-slate-500">Based on known track durations</span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Longest Streak</span>
                  <p className="text-2xl font-black font-mono text-amber-400 flex items-center gap-1">
                    <Flame className="w-5 h-5 fill-current" />
                    <span>{storyData.activity.longestStreakDays}d</span>
                  </p>
                  <span className="text-[11px] text-slate-500">Consecutive days</span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Peak Month</span>
                  <p className="text-lg font-bold text-emerald-300">
                    {storyData.activity.mostActiveMonth}
                  </p>
                  <span className="text-[11px] text-slate-500">Highest volume</span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Busiest Hour</span>
                  <p className="text-lg font-bold text-cyan-300">
                    {storyData.activity.busiestHourLabel}
                  </p>
                  <span className="text-[11px] text-slate-500">Circadian peak</span>
                </div>

                <div className="col-span-2 p-4 rounded-3xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Busiest Day Record</span>
                  <p className="text-base font-bold text-white mt-1">
                    {storyData.activity.busiestDayFormatted} ({storyData.activity.busiestDayPlays} scrobbles)
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Tracked accurately with daily calendar logs
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 4 — YOUR LISTENING FINGERPRINT
              ===================================================== */}
          {activeStoryCard === 3 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-purple-400 font-bold">
                  Card 04 / 08 · Dimensions
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Listening Fingerprint
                </h2>
              </div>

              <div className="space-y-4 my-auto">
                <div className="p-4 rounded-3xl bg-purple-950/30 border border-purple-500/40 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-300 tracking-widest">
                    Your Archetype
                  </span>
                  <h3 className="text-xl font-black text-white font-display">
                    {storyData.fingerprint.archetype}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed px-2">
                    {storyData.fingerprint.description}
                  </p>
                </div>

                {/* Dimension score bars */}
                <div className="space-y-2">
                  {storyData.fingerprint.dimensions.map((d) => (
                    <div key={d.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{d.label}</span>
                        <span className="font-bold text-white">{d.score} / 100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Computed with exact statistical entropy & standard deviation formulas
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 5 — LISTENING CLOCK
              ===================================================== */}
          {activeStoryCard === 5 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
                  Card 05 / 08 · Circadian Rhythm
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Listening Clock
                </h2>
              </div>

              <div className="space-y-6 my-auto text-center">
                <div className="w-28 h-28 mx-auto rounded-full border-4 border-emerald-500/40 flex items-center justify-center bg-emerald-950/20 shadow-xl">
                  <Clock className="w-12 h-12 text-emerald-400" />
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                    Peak Hour: {storyData.clock.busiestHourLabel}
                  </span>
                  <p className="text-base font-bold text-white font-display">
                    {storyData.clock.clockStatement}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Quietest downtime: {storyData.clock.quietestPeriodLabel}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Parsed cleanly in your local timezone without UTC mixing
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 6 — REDISCOVER
              ===================================================== */}
          {activeStoryCard === 7 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-purple-400 font-bold">
                  Card 06 / 08 · Memory Lane
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Lost Gems & Rediscovery
                </h2>
              </div>

              <div className="space-y-4 my-auto">
                {storyData.rediscover.headlineTrack ? (
                  <div className="p-4 rounded-3xl bg-slate-900/90 border border-purple-500/40 space-y-3">
                    <div className="flex items-center gap-3.5">
                      <ArtworkThumb
                        src={storyData.rediscover.headlineTrack.artworkUrl}
                        alt={storyData.rediscover.headlineTrack.title}
                        sizeClass="w-14 h-14"
                        roundedClass="rounded-2xl"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-purple-300">
                          Forgotten Favorite
                        </span>
                        <h4 className="text-sm font-bold text-white truncate font-display">
                          {storyData.rediscover.headlineTrack.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {storyData.rediscover.headlineTrack.artistName}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20 text-xs text-slate-300 font-mono leading-relaxed">
                      {storyData.rediscover.headlineTrack.evidenceExplanation}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    All your catalog favorites remain actively played!
                  </p>
                )}
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Algorithmic dormancy detection based on peak vs recent gap
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 7 — YOUR LISTENING HABITS
              ===================================================== */}
          {activeStoryCard === 8 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">
                  Card 07 / 08 · Inferred Sessions
                </span>
                <h2 className="text-2xl font-black text-white font-display mt-0.5">
                  Listening Habits
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 my-auto">
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Avg Session</span>
                  <p className="text-2xl font-black font-mono text-white">
                    {storyData.habits.avgSessionDurationFormatted}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    ~{storyData.habits.avgTracksPerSession} tracks / session
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Peak Session</span>
                  <p className="text-2xl font-black font-mono text-cyan-400">
                    {storyData.habits.longestSessionDurationFormatted}
                  </p>
                  <span className="text-[11px] text-slate-500">Longest deep immersion</span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Consistent Day</span>
                  <p className="text-lg font-bold text-amber-400">
                    {storyData.habits.mostConsistentDay}
                  </p>
                  <span className="text-[11px] text-slate-500">Highest fidelity pattern</span>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Max Inactive Gap</span>
                  <p className="text-lg font-bold text-slate-200">
                    {storyData.habits.longestGapFormatted}
                  </p>
                  <span className="text-[11px] text-slate-500">Between listening blocks</span>
                </div>

                {storyData.habits.mostRepeatedTrack && (
                  <div className="col-span-2 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Most Repeated Track Loop
                    </span>
                    <p className="text-xs font-bold text-white truncate mt-0.5">
                      {storyData.habits.mostRepeatedTrack.title} · {storyData.habits.mostRepeatedTrack.artistName}
                    </p>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Played {storyData.habits.mostRepeatedTrack.plays} times
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] font-mono text-slate-400 text-center">
                Sessions are grouped by timestamp gaps; duration uses verified track metadata.
              </p>
            </div>
          )}

          {/* =====================================================
              CARD 8 — CLOSING
              ===================================================== */}
          {activeStoryCard === 9 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in duration-300 space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold">
                  Card 08 / 08 · Finale
                </span>
                <h2 className="text-3xl font-black text-white font-display mt-0.5">
                  That’s Your Listening Story.
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {storyData.intro.periodLabel} recap on ScrobbleX
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-3 shadow-2xl my-auto">
                <p className="text-4xl font-black font-mono text-white">
                  {storyData.closing.totalScrobbles.toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-300">
                  <span>{storyData.closing.totalArtists} artists</span>
                  <span>·</span>
                  <span>{storyData.closing.totalTracks} tracks</span>
                  <span>·</span>
                  <span>{storyData.closing.totalDaysOfListening} days</span>
                </div>
                <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800">
                  "Your music. Your history. Your patterns."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {copiedNotification && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono text-center flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Story stats copied to clipboard!</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Card</span>
                  </button>

                  <button
                    onClick={handleExportStory}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <button
                  onClick={() => setCurrentCardIndex(0)}
                  className="w-full py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Story from Beginning</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
