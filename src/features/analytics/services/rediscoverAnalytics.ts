import { RediscoverCandidate, RediscoverCategory, Scrobble } from '../../../types/music';
import { formatDateHuman, REFERENCE_NOW_EPOCH, tracksMap } from './analyticsCore';

export interface RediscoverConfig {
  minHistoricalPlays: number;
  minDormantDays: number;
}

export function getRediscoverCandidates(
  scrobbles: Scrobble[],
  config: RediscoverConfig = { minHistoricalPlays: 25, minDormantDays: 90 }
): RediscoverCandidate[] {
  if (scrobbles.length === 0) return [];

  const byTrack = new Map<string, Scrobble[]>();
  for (const s of scrobbles) {
    const list = byTrack.get(s.trackId) || [];
    list.push(s);
    byTrack.set(s.trackId, list);
  }

  const candidates: RediscoverCandidate[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  byTrack.forEach((trackScrobbles, trackId) => {
    const totalPlays = trackScrobbles.length;
    if (totalPlays < config.minHistoricalPlays) return;

    const trk = tracksMap.get(trackId);
    if (!trk) return;

    const asc = [...trackScrobbles].sort((a, b) => a.timestamp - b.timestamp);
    const lastTs = asc[asc.length - 1].timestamp;
    const daysSinceLastPlay = Math.max(0, Math.floor((REFERENCE_NOW_EPOCH - lastTs) / 86400));

    const byMonthKey = new Map<string, number>();
    let recent14d = 0;
    let recent60d = 0;

    for (const s of asc) {
      const mKey = `${s.year}-${s.month}`;
      byMonthKey.set(mKey, (byMonthKey.get(mKey) || 0) + 1);
      if (REFERENCE_NOW_EPOCH - s.timestamp <= 14 * 86400) recent14d++;
      if (REFERENCE_NOW_EPOCH - s.timestamp <= 60 * 86400) recent60d++;
    }

    let peakMKey = '';
    let peakPlays = 0;
    byMonthKey.forEach((cnt, mk) => {
      if (cnt > peakPlays) {
        peakPlays = cnt;
        peakMKey = mk;
      }
    });

    const [pY, pM] = peakMKey.split('-').map(Number);
    const nextMonthName = monthNames[(pM + 1) % 12];
    const peakPeriodLabel = `${monthNames[pM]}–${nextMonthName} ${pY}`;
    const concentrationRatio = Number((peakPlays / totalPlays).toFixed(2));

    let maxGapDays = 0;
    for (let i = 1; i < asc.length; i++) {
      const gapD = Math.floor((asc[i].timestamp - asc[i - 1].timestamp) / 86400);
      if (gapD > maxGapDays) maxGapDays = gapD;
    }

    let category: RediscoverCategory | null = null;
    let evidenceExplanation = '';
    let score = 0;

    if (daysSinceLastPlay >= config.minDormantDays) {
      if (concentrationRatio >= 0.55) {
        category = 'old_obsessions';
        score = Math.round(totalPlays * 1.1 + daysSinceLastPlay * 0.35 + concentrationRatio * 40);
        evidenceExplanation = `${Math.round(concentrationRatio * 100)}% of your ${totalPlays} lifetime plays occurred during ${peakPeriodLabel}, followed by ${daysSinceLastPlay} days of complete silence.`;
      } else {
        category = 'forgotten_favorites';
        score = Math.round(totalPlays * 1.25 + daysSinceLastPlay * 0.4);
        evidenceExplanation = `Played ${totalPlays} times historically with a peak in ${peakPeriodLabel}, but untouched for ${daysSinceLastPlay} days.`;
      }
    } else if (recent14d >= 3 && maxGapDays >= 70) {
      category = 'recently_returned';
      score = Math.round(totalPlays * 0.9 + maxGapDays * 0.45 + recent14d * 5);
      evidenceExplanation = `Dormant for ${maxGapDays} consecutive days after its ${peakPeriodLabel} peak, then resurfaced with ${recent14d} plays in the past 2 weeks.`;
    } else if (recent60d === 0 && daysSinceLastPlay >= 60) {
      category = 'fading_favorites';
      score = Math.round(totalPlays * 1.0 + daysSinceLastPlay * 0.3);
      evidenceExplanation = `Formerly a regular rotation staple (${totalPlays} plays, peak in ${peakPeriodLabel}), now 0 plays over the past ${daysSinceLastPlay} days.`;
    }

    if (category) {
      candidates.push({
        trackId,
        title: trk.title,
        artistId: trk.artistId,
        artistName: trk.artistName,
        albumId: trk.albumId,
        albumTitle: trk.albumTitle,
        artworkUrl: trk.artworkUrl,
        totalHistoricalPlays: totalPlays,
        daysSinceLastPlay,
        lastPlayedDate: formatDateHuman(new Date(lastTs * 1000).toISOString()),
        peakPeriodLabel,
        peakPeriodPlays: peakPlays,
        concentrationRatio,
        recentPlaysLast14d: recent14d,
        category,
        score,
        evidenceExplanation,
        loved: trk.loved,
      });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}
