import {
  Album,
  Artist,
  Scrobble,
  SyncState,
  Track,
  UserProfile,
} from '../types/music';

// Resilient deterministic SVG data-URI artwork generator
function createArtworkSvg(
  label: string,
  sub: string,
  c1: string,
  c2: string,
  accent: string,
  iconStyle: 'vinyl' | 'waveform' | 'synth' | 'portrait' = 'vinyl'
): string {
  const initials = label
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  let centerGraphic = '';
  if (iconStyle === 'vinyl') {
    centerGraphic = `
      <circle cx="120" cy="120" r="82" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="1.5" />
      <circle cx="120" cy="120" r="54" fill="none" stroke="${accent}" stroke-opacity="0.38" stroke-width="1.2" />
      <circle cx="120" cy="120" r="18" fill="${accent}" fill-opacity="0.3" stroke="${accent}" stroke-width="1" />
      <circle cx="120" cy="120" r="5" fill="#FFFFFF" />
    `;
  } else if (iconStyle === 'waveform') {
    centerGraphic = `
      <rect x="52" y="80" width="8" height="80" rx="4" fill="${accent}" fill-opacity="0.6" />
      <rect x="74" y="60" width="8" height="120" rx="4" fill="${accent}" fill-opacity="0.8" />
      <rect x="96" y="90" width="8" height="60" rx="4" fill="${accent}" fill-opacity="0.5" />
      <rect x="118" y="45" width="8" height="150" rx="4" fill="${accent}" />
      <rect x="140" y="70" width="8" height="100" rx="4" fill="${accent}" fill-opacity="0.75" />
      <rect x="162" y="95" width="8" height="50" rx="4" fill="${accent}" fill-opacity="0.4" />
      <rect x="184" y="85" width="8" height="70" rx="4" fill="${accent}" fill-opacity="0.6" />
    `;
  } else if (iconStyle === 'portrait') {
    centerGraphic = `
      <circle cx="120" cy="88" r="38" fill="${accent}" fill-opacity="0.4" stroke="${accent}" stroke-width="1.5" />
      <path d="M 64 190 C 64 145, 176 145, 176 190" fill="${accent}" fill-opacity="0.25" stroke="${accent}" stroke-width="1.5" />
      <circle cx="120" cy="86" r="48" fill="none" stroke="${accent}" stroke-dasharray="4 4" stroke-opacity="0.4" />
    `;
  } else {
    centerGraphic = `
      <rect x="40" y="70" width="160" height="100" rx="12" fill="#000000" fill-opacity="0.3" stroke="${accent}" stroke-width="1.5" />
      <circle cx="80" cy="120" r="22" fill="none" stroke="${accent}" stroke-width="2" />
      <circle cx="160" cy="120" r="22" fill="none" stroke="${accent}" stroke-width="2" />
      <line x1="80" y1="120" x2="160" y2="120" stroke="${accent}" stroke-width="1.5" stroke-dasharray="3 3" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="240" height="240" fill="url(#g)" />
    ${centerGraphic}
    <text x="24" y="44" fill="#F8FAFC" font-family="monospace" font-size="20" font-weight="700" letter-spacing="2">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'lastfm_user',
  displayName: 'ScrobbleX User',
  avatarUrl: createArtworkSvg('ScrobbleX', 'Listener', '#0A1128', '#001F54', '#38BDF8', 'portrait'),
  memberSince: '2024-01-01',
  registeredTimestamp: 1704067200,
  country: 'Earth',
  currentObsessionTrackId: 'trk_cheques',
  pinnedTrackId: 'trk_says',
};

export const ARTISTS_CATALOG: Artist[] = [
  { id: 'art_karan_aujla', name: 'Karan Aujla', artworkUrl: createArtworkSvg('Karan Aujla', 'Hip-Hop', '#140F07', '#2A1805', '#F59E0B', 'vinyl'), primaryGenre: 'Punjabi Hip-Hop' },
  { id: 'art_arijit_singh', name: 'Arijit Singh', artworkUrl: createArtworkSvg('Arijit Singh', 'Soul', '#0F172A', '#1E293B', '#38BDF8', 'waveform'), primaryGenre: 'Indian Pop & Ballad' },
  { id: 'art_sanam', name: 'SANAM', artworkUrl: createArtworkSvg('SANAM', 'Acoustic', '#091526', '#172554', '#60A5FA', 'synth'), primaryGenre: 'Indie Pop Rock' },
  { id: 'art_diljit', name: 'Diljit Dosanjh', artworkUrl: createArtworkSvg('Diljit Dosanjh', 'Pop', '#111827', '#312E81', '#A855F7', 'vinyl'), primaryGenre: 'Punjabi Pop' },
  { id: 'art_ap_dhillon', name: 'AP Dhillon', artworkUrl: createArtworkSvg('AP Dhillon', 'R&B', '#111827', '#1F2937', '#34D399', 'waveform'), primaryGenre: 'Punjabi R&B' },
  { id: 'art_fred_again', name: 'Fred again..', artworkUrl: createArtworkSvg('Fred again..', 'Electronic', '#0A1215', '#064E3B', '#10B981', 'synth'), primaryGenre: 'UK Electronic' },
  { id: 'art_weeknd', name: 'The Weeknd', artworkUrl: createArtworkSvg('The Weeknd', 'Synthwave', '#090D16', '#1E1B4B', '#818CF8', 'waveform'), primaryGenre: 'Alternative R&B' },
  { id: 'art_tame_impala', name: 'Tame Impala', artworkUrl: createArtworkSvg('Tame Impala', 'Psych', '#0C1928', '#064E3B', '#10B981', 'synth'), primaryGenre: 'Psychedelic Synth' },
  { id: 'art_pritam', name: 'Pritam', artworkUrl: createArtworkSvg('Pritam', 'Soundtrack', '#18181B', '#27272A', '#F59E0B', 'waveform'), primaryGenre: 'Contemporary Soundtrack' },
  { id: 'art_ar_rahman', name: 'A.R. Rahman', artworkUrl: createArtworkSvg('AR Rahman', 'Orchestral', '#0F172A', '#1E3A8A', '#60A5FA', 'synth'), primaryGenre: 'Ambient Orchestral' },
  { id: 'art_bicep', name: 'Bicep', artworkUrl: createArtworkSvg('Bicep', 'Breaks', '#0A1128', '#1C2541', '#38BDF8', 'synth'), primaryGenre: 'Melodic Breakbeat' },
  { id: 'art_bonobo', name: 'Bonobo', artworkUrl: createArtworkSvg('Bonobo', 'Downtempo', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), primaryGenre: 'Downtempo Electronic' },
  { id: 'art_khruangbin', name: 'Khruangbin', artworkUrl: createArtworkSvg('Khruangbin', 'Funk', '#131C2E', '#065F46', '#34D399', 'waveform'), primaryGenre: 'Psychedelic Funk' },
  { id: 'art_radiohead', name: 'Radiohead', artworkUrl: createArtworkSvg('Radiohead', 'Art Rock', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), primaryGenre: 'Art Rock' },
  { id: 'art_raf_saperra', name: 'Raf Saperra', artworkUrl: createArtworkSvg('Raf Saperra', 'Folk', '#170E08', '#2D1B0E', '#F97316', 'waveform'), primaryGenre: 'Folk Hip-Hop' },
  { id: 'art_shreya', name: 'Shreya Ghoshal', artworkUrl: createArtworkSvg('Shreya Ghoshal', 'Classical', '#0F172A', '#312E81', '#A5B4FC', 'synth'), primaryGenre: 'Melodic Vocal' },
  { id: 'art_seedhe_maut', name: 'Seedhe Maut', artworkUrl: createArtworkSvg('Seedhe Maut', 'Rap', '#09090B', '#18181B', '#EF4444', 'waveform'), primaryGenre: 'Underground Hip-Hop' },
  { id: 'art_prateek_kuhad', name: 'Prateek Kuhad', artworkUrl: createArtworkSvg('Prateek Kuhad', 'Indie', '#0F172A', '#1E293B', '#38BDF8', 'vinyl'), primaryGenre: 'Indie Folk' },
  { id: 'art_daft_punk', name: 'Daft Punk', artworkUrl: createArtworkSvg('Daft Punk', 'French House', '#18181B', '#27272A', '#EAB308', 'synth'), primaryGenre: 'French House' },
  { id: 'art_ikky', name: 'Ikky', artworkUrl: createArtworkSvg('Ikky', 'Production', '#140F07', '#2A1805', '#F59E0B', 'waveform'), primaryGenre: 'Punjabi Production' },
  { id: 'art_vishal_shekhar', name: 'Vishal-Shekhar', artworkUrl: createArtworkSvg('Vishal Shekhar', 'Pop', '#111827', '#1E3A8A', '#3B82F6', 'synth'), primaryGenre: 'Modern Pop' },
  { id: 'art_anuv_jain', name: 'Anuv Jain', artworkUrl: createArtworkSvg('Anuv Jain', 'Acoustic', '#0B132B', '#1C2541', '#5BC0BE', 'vinyl'), primaryGenre: 'Acoustic Singer' },
  { id: 'art_subbhi', name: 'Shubh', artworkUrl: createArtworkSvg('Shubh', 'Trap', '#140F07', '#2A1805', '#F59E0B', 'waveform'), primaryGenre: 'Punjabi Trap' },
  { id: 'art_four_tet', name: 'Four Tet', artworkUrl: createArtworkSvg('Four Tet', 'Microhouse', '#0A1215', '#064E3B', '#10B981', 'synth'), primaryGenre: 'Microhouse' },
  { id: 'art_chvrches', name: 'CHVRCHES', artworkUrl: createArtworkSvg('CHVRCHES', 'Synthpop', '#090D16', '#172554', '#38BDF8', 'synth'), primaryGenre: 'Synthpop' },
  { id: 'art_kaytranada', name: 'KAYTRANADA', artworkUrl: createArtworkSvg('KAYTRANADA', 'Bounce', '#090D16', '#1E1B4B', '#818CF8', 'synth'), primaryGenre: 'Future Bounce' },
  { id: 'art_nils_frahm', name: 'Nils Frahm', artworkUrl: createArtworkSvg('Nils Frahm', 'Piano', '#0A1128', '#1C2541', '#38BDF8', 'waveform'), primaryGenre: 'Neo-Classical Piano' },
  { id: 'art_divine', name: 'DIVINE', artworkUrl: createArtworkSvg('DIVINE', 'Gully', '#18181B', '#27272A', '#EF4444', 'waveform'), primaryGenre: 'Gully Rap' },
  { id: 'art_talwiinder', name: 'Talwiinder', artworkUrl: createArtworkSvg('Talwiinder', 'Alt Punjabi', '#0A0F1D', '#1E293B', '#10B981', 'waveform'), primaryGenre: 'Alternative Synth' },
  { id: 'art_floating_points', name: 'Floating Points', artworkUrl: createArtworkSvg('Floating Points', 'Modular', '#0A1215', '#064E3B', '#10B981', 'synth'), primaryGenre: 'Modular Jazz' },
  { id: 'art_burial', name: 'Burial', artworkUrl: createArtworkSvg('Burial', 'Garage', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), primaryGenre: 'Future Garage' },
  { id: 'art_tycho', name: 'Tycho', artworkUrl: createArtworkSvg('Tycho', 'Ambient', '#0F172A', '#064E3B', '#34D399', 'synth'), primaryGenre: 'Ambient Post-Rock' },
  { id: 'art_coke_studio', name: 'Coke Studio Bharat', artworkUrl: createArtworkSvg('Coke Studio', 'Fusion', '#111827', '#1E293B', '#60A5FA', 'waveform'), primaryGenre: 'Folk Fusion' },
  { id: 'art_krsna', name: 'KR$NA', artworkUrl: createArtworkSvg('KR$NA', 'Rap', '#140F07', '#2A1805', '#F59E0B', 'waveform'), primaryGenre: 'Lyrical Hip-Hop' },
  { id: 'art_jai_paul', name: 'Jai Paul', artworkUrl: createArtworkSvg('Jai Paul', 'R&B', '#090D16', '#1E1B4B', '#818CF8', 'synth'), primaryGenre: 'Experimental R&B' },
  { id: 'art_ben_bohmer', name: 'Ben Böhmer', artworkUrl: createArtworkSvg('Ben Böhmer', 'Progressive', '#0A1128', '#1C2541', '#38BDF8', 'synth'), primaryGenre: 'Deep Progressive' },
  { id: 'art_jon_hopkins', name: 'Jon Hopkins', artworkUrl: createArtworkSvg('Jon Hopkins', 'Techno', '#0A1215', '#064E3B', '#10B981', 'synth'), primaryGenre: 'Techno Ambient' },
  { id: 'art_peter_cat', name: 'Peter Cat Recording Co.', artworkUrl: createArtworkSvg('PCRC', 'Cabaret', '#090D16', '#1E293B', '#38BDF8', 'vinyl'), primaryGenre: 'Gypsy Jazz' },
  { id: 'art_moderat', name: 'Moderat', artworkUrl: createArtworkSvg('Moderat', 'IDM', '#111827', '#312E81', '#A855F7', 'synth'), primaryGenre: 'Electronic IDM' },
  { id: 'art_rival_consoles', name: 'Rival Consoles', artworkUrl: createArtworkSvg('Rival Consoles', 'Electronica', '#0A1215', '#064E3B', '#10B981', 'synth'), primaryGenre: 'Analog Electronica' },
];

export const ALBUMS_CATALOG: Album[] = [
  { id: 'alb_making_memories', title: 'Making Memories', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', artworkUrl: createArtworkSvg('Making Memories', '2023', '#1A1208', '#2D1B0E', '#F59E0B', 'vinyl'), releaseYear: 2023 },
  { id: 'alb_street_dreams', title: 'Street Dreams', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', artworkUrl: createArtworkSvg('Street Dreams', '2024', '#140F07', '#2A1805', '#F59E0B', 'waveform'), releaseYear: 2024 },
  { id: 'alb_way_ahead', title: 'Way Ahead EP', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', artworkUrl: createArtworkSvg('Way Ahead', '2022', '#1B1408', '#34200B', '#EAB308', 'vinyl'), releaseYear: 2022 },
  { id: 'alb_arijit_unplugged', title: 'Soulful Nocturnes', artistId: 'art_arijit_singh', artistName: 'Arijit Singh', artworkUrl: createArtworkSvg('Soulful Nocturnes', '2023', '#0F172A', '#1E293B', '#38BDF8', 'waveform'), releaseYear: 2023 },
  { id: 'alb_sanam_revisited', title: 'Sanam Classics Revived', artistId: 'art_sanam', artistName: 'SANAM', artworkUrl: createArtworkSvg('Sanam Classics', '2024', '#091526', '#172554', '#60A5FA', 'synth'), releaseYear: 2024 },
  { id: 'alb_ghost', title: 'Ghost', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', artworkUrl: createArtworkSvg('Ghost', '2023', '#111827', '#312E81', '#A855F7', 'waveform'), releaseYear: 2023 },
  { id: 'alb_moonchild', title: 'MoonChild Era', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', artworkUrl: createArtworkSvg('MoonChild', '2021', '#111827', '#1F2937', '#818CF8', 'synth'), releaseYear: 2021 },
  { id: 'alb_hidden_gems', title: 'Hidden Gems', artistId: 'art_ap_dhillon', artistName: 'AP Dhillon', artworkUrl: createArtworkSvg('Hidden Gems', '2022', '#111827', '#1F2937', '#34D399', 'waveform'), releaseYear: 2022 },
  { id: 'alb_actual_life_3', title: 'Actual Life 3', artistId: 'art_fred_again', artistName: 'Fred again..', artworkUrl: createArtworkSvg('Actual Life 3', '2022', '#0A1215', '#064E3B', '#10B981', 'synth'), releaseYear: 2022 },
  { id: 'alb_ten_days', title: 'ten days', artistId: 'art_fred_again', artistName: 'Fred again..', artworkUrl: createArtworkSvg('ten days', '2024', '#064E3B', '#022C22', '#34D399', 'synth'), releaseYear: 2024 },
  { id: 'alb_after_hours', title: 'After Hours', artistId: 'art_weeknd', artistName: 'The Weeknd', artworkUrl: createArtworkSvg('After Hours', '2020', '#090D16', '#1E1B4B', '#818CF8', 'waveform'), releaseYear: 2020 },
  { id: 'alb_currents', title: 'Currents', artistId: 'art_tame_impala', artistName: 'Tame Impala', artworkUrl: createArtworkSvg('Currents', '2015', '#0C1928', '#064E3B', '#10B981', 'synth'), releaseYear: 2015 },
  { id: 'alb_brahmastra', title: 'Midnight Soundscapes', artistId: 'art_pritam', artistName: 'Pritam', artworkUrl: createArtworkSvg('Midnight Soundscapes', '2023', '#18181B', '#27272A', '#F59E0B', 'waveform'), releaseYear: 2023 },
  { id: 'alb_rockstar', title: 'Rockstar Deluxe', artistId: 'art_ar_rahman', artistName: 'A.R. Rahman', artworkUrl: createArtworkSvg('Rockstar', '2011', '#0F172A', '#1E3A8A', '#60A5FA', 'synth'), releaseYear: 2011 },
  { id: 'alb_isles', title: 'Isles', artistId: 'art_bicep', artistName: 'Bicep', artworkUrl: createArtworkSvg('Isles', '2021', '#0A1128', '#1C2541', '#38BDF8', 'synth'), releaseYear: 2021 },
  { id: 'alb_fragments', title: 'Fragments', artistId: 'art_bonobo', artistName: 'Bonobo', artworkUrl: createArtworkSvg('Fragments', '2022', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), releaseYear: 2022 },
  { id: 'alb_mordechai', title: 'Mordechai', artistId: 'art_khruangbin', artistName: 'Khruangbin', artworkUrl: createArtworkSvg('Mordechai', '2020', '#131C2E', '#065F46', '#34D399', 'waveform'), releaseYear: 2020 },
  { id: 'alb_in_rainbows', title: 'In Rainbows', artistId: 'art_radiohead', artistName: 'Radiohead', artworkUrl: createArtworkSvg('In Rainbows', '2007', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), releaseYear: 2007 },
  { id: 'alb_ruff_around', title: 'Ruff Around the Edges', artistId: 'art_raf_saperra', artistName: 'Raf Saperra', artworkUrl: createArtworkSvg('Ruff Around', '2024', '#170E08', '#2D1B0E', '#F97316', 'waveform'), releaseYear: 2024 },
  { id: 'alb_lunch_break', title: 'Lunch Break', artistId: 'art_seedhe_maut', artistName: 'Seedhe Maut', artworkUrl: createArtworkSvg('Lunch Break', '2023', '#09090B', '#18181B', '#EF4444', 'waveform'), releaseYear: 2023 },
  { id: 'alb_cold_mess', title: 'cold/mess', artistId: 'art_prateek_kuhad', artistName: 'Prateek Kuhad', artworkUrl: createArtworkSvg('cold mess', '2018', '#0F172A', '#1E293B', '#38BDF8', 'vinyl'), releaseYear: 2018 },
  { id: 'alb_ram', title: 'Random Access Memories', artistId: 'art_daft_punk', artistName: 'Daft Punk', artworkUrl: createArtworkSvg('RAM', '2013', '#18181B', '#27272A', '#EAB308', 'synth'), releaseYear: 2013 },
  { id: 'alb_still_rollin', title: 'Still Rollin', artistId: 'art_subbhi', artistName: 'Shubh', artworkUrl: createArtworkSvg('Still Rollin', '2023', '#140F07', '#2A1805', '#F59E0B', 'waveform'), releaseYear: 2023 },
  { id: 'alb_three', title: 'Three', artistId: 'art_four_tet', artistName: 'Four Tet', artworkUrl: createArtworkSvg('Three', '2024', '#0A1215', '#064E3B', '#10B981', 'synth'), releaseYear: 2024 },
  { id: 'alb_timeless', title: 'TIMELESS', artistId: 'art_kaytranada', artistName: 'KAYTRANADA', artworkUrl: createArtworkSvg('TIMELESS', '2024', '#090D16', '#1E1B4B', '#818CF8', 'synth'), releaseYear: 2024 },
  { id: 'alb_all_melody', title: 'All Melody', artistId: 'art_nils_frahm', artistName: 'Nils Frahm', artworkUrl: createArtworkSvg('All Melody', '2018', '#0A1128', '#1C2541', '#38BDF8', 'waveform'), releaseYear: 2018 },
  { id: 'alb_gunehgar', title: 'Gunehgar', artistId: 'art_divine', artistName: 'DIVINE', artworkUrl: createArtworkSvg('Gunehgar', '2022', '#18181B', '#27272A', '#EF4444', 'waveform'), releaseYear: 2022 },
  { id: 'alb_talwiinder_ep', title: 'Midnight Confessions', artistId: 'art_talwiinder', artistName: 'Talwiinder', artworkUrl: createArtworkSvg('Midnight Confessions', '2025', '#0A0F1D', '#1E293B', '#10B981', 'waveform'), releaseYear: 2025 },
  { id: 'alb_cascade', title: 'Cascade', artistId: 'art_floating_points', artistName: 'Floating Points', artworkUrl: createArtworkSvg('Cascade', '2024', '#0A1215', '#064E3B', '#10B981', 'synth'), releaseYear: 2024 },
  { id: 'alb_untrue', title: 'Untrue', artistId: 'art_burial', artistName: 'Burial', artworkUrl: createArtworkSvg('Untrue', '2007', '#090D16', '#1E293B', '#94A3B8', 'vinyl'), releaseYear: 2007 },
  { id: 'alb_dive', title: 'Dive', artistId: 'art_tycho', artistName: 'Tycho', artworkUrl: createArtworkSvg('Dive', '2011', '#0F172A', '#064E3B', '#34D399', 'synth'), releaseYear: 2011 },
  { id: 'alb_bismillah', title: 'Bismillah', artistId: 'art_peter_cat', artistName: 'Peter Cat Recording Co.', artworkUrl: createArtworkSvg('Bismillah', '2019', '#090D16', '#1E293B', '#38BDF8', 'vinyl'), releaseYear: 2019 },
  { id: 'alb_dil_se', title: 'Dil Se.. (Original Soundtrack)', artistId: 'art_ar_rahman', artistName: 'A.R. Rahman', artworkUrl: createArtworkSvg('Dil Se', '1998', '#1E1B4B', '#312E81', '#F43F5E', 'waveform'), releaseYear: 1998 },
  { id: 'alb_retro_80s', title: 'Midnight Disco & Soul', artistId: 'art_sanam', artistName: 'SANAM', artworkUrl: createArtworkSvg('80s Retro', '1982', '#140F07', '#2A1805', '#F59E0B', 'vinyl'), releaseYear: 1982 },
  { id: 'alb_classics_70s', title: 'Acoustic Cinema 1975', artistId: 'art_sanam', artistName: 'SANAM', artworkUrl: createArtworkSvg('70s Cinema', '1975', '#0F172A', '#1E293B', '#34D399', 'vinyl'), releaseYear: 1975 },
  { id: 'alb_golden_60s', title: 'Golden Ragas 1965', artistId: 'art_shreya', artistName: 'Shreya Ghoshal', artworkUrl: createArtworkSvg('60s Ragas', '1965', '#18181B', '#27272A', '#EAB308', 'synth'), releaseYear: 1965 },
  { id: 'alb_vintage_50s', title: 'Archival Heritage Pre-1960', artistId: 'art_shreya', artistName: 'Shreya Ghoshal', artworkUrl: createArtworkSvg('Heritage', '1952', '#0A0A0A', '#1C1917', '#A8A29E', 'vinyl'), releaseYear: 1952 },
];

export const TRACKS_CATALOG: Track[] = [
  // Karan Aujla
  { id: 'trk_real_bad_man', title: 'Real Bad Man', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_street_dreams', albumTitle: 'Street Dreams', artworkUrl: ALBUMS_CATALOG[1].artworkUrl, durationSec: 192, loved: true, lovedAt: 1759160000 },
  { id: 'trk_softly', title: 'Softly', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_making_memories', albumTitle: 'Making Memories', artworkUrl: ALBUMS_CATALOG[0].artworkUrl, durationSec: 155, loved: true, lovedAt: 1741000000 },
  { id: 'trk_winning_speech', title: 'Winning Speech', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_street_dreams', albumTitle: 'Street Dreams', artworkUrl: ALBUMS_CATALOG[1].artworkUrl, durationSec: 208, loved: true, lovedAt: 1754000000 },
  { id: 'trk_admirin_you', title: "Admirin' You", artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_making_memories', albumTitle: 'Making Memories', artworkUrl: ALBUMS_CATALOG[0].artworkUrl, durationSec: 214, loved: true, lovedAt: 1732000000 },
  { id: 'trk_52_bars', title: '52 Bars', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_way_ahead', albumTitle: 'Way Ahead EP', artworkUrl: ALBUMS_CATALOG[2].artworkUrl, durationSec: 218, loved: true, lovedAt: 1720000000 },
  { id: 'trk_try_me', title: 'Try Me', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_making_memories', albumTitle: 'Making Memories', artworkUrl: ALBUMS_CATALOG[0].artworkUrl, durationSec: 178, loved: false },
  { id: 'trk_bachke_bachke', title: 'Bachke Bachke', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_making_memories', albumTitle: 'Making Memories', artworkUrl: ALBUMS_CATALOG[0].artworkUrl, durationSec: 201, loved: false },
  { id: 'trk_on_top', title: 'On Top', artistId: 'art_karan_aujla', artistName: 'Karan Aujla', albumId: 'alb_way_ahead', albumTitle: 'Way Ahead EP', artworkUrl: ALBUMS_CATALOG[2].artworkUrl, durationSec: 184, loved: true, lovedAt: 1715000000 },

  // Arijit Singh
  { id: 'trk_kesariya', title: 'Kesariya (Acoustic Mix)', artistId: 'art_arijit_singh', artistName: 'Arijit Singh', albumId: 'alb_arijit_unplugged', albumTitle: 'Soulful Nocturnes', artworkUrl: ALBUMS_CATALOG[3].artworkUrl, durationSec: 268, loved: true, lovedAt: 1738000000 },
  { id: 'trk_channa_mereya', title: 'Channa Mereya', artistId: 'art_arijit_singh', artistName: 'Arijit Singh', albumId: 'alb_arijit_unplugged', albumTitle: 'Soulful Nocturnes', artworkUrl: ALBUMS_CATALOG[3].artworkUrl, durationSec: 289, loved: true, lovedAt: 1718000000 },
  { id: 'trk_agar_tum', title: 'Agar Tum Saath Ho', artistId: 'art_arijit_singh', artistName: 'Arijit Singh', albumId: 'alb_arijit_unplugged', albumTitle: 'Soulful Nocturnes', artworkUrl: ALBUMS_CATALOG[3].artworkUrl, durationSec: 341, loved: true, lovedAt: 1712000000 },
  { id: 'trk_satranga', title: 'Satranga', artistId: 'art_arijit_singh', artistName: 'Arijit Singh', albumId: 'alb_arijit_unplugged', albumTitle: 'Soulful Nocturnes', artworkUrl: ALBUMS_CATALOG[3].artworkUrl, durationSec: 271, loved: false },

  // SANAM
  { id: 'trk_gulabi_aankhen', title: 'Gulabi Aankhen (Session)', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_sanam_revisited', albumTitle: 'Sanam Classics Revived', artworkUrl: ALBUMS_CATALOG[4].artworkUrl, durationSec: 198, loved: true, lovedAt: 1756000000 },
  { id: 'trk_lag_jaa_gale', title: 'Lag Jaa Gale', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_sanam_revisited', albumTitle: 'Sanam Classics Revived', artworkUrl: ALBUMS_CATALOG[4].artworkUrl, durationSec: 232, loved: true, lovedAt: 1757200000 },
  { id: 'trk_mere_mehboob', title: 'Mere Mehboob Qayamat Hogi', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_sanam_revisited', albumTitle: 'Sanam Classics Revived', artworkUrl: ALBUMS_CATALOG[4].artworkUrl, durationSec: 215, loved: false },
  { id: 'trk_o_mere_dil', title: 'O Mere Dil Ke Chain', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_sanam_revisited', albumTitle: 'Sanam Classics Revived', artworkUrl: ALBUMS_CATALOG[4].artworkUrl, durationSec: 205, loved: false },

  // Diljit Dosanjh
  { id: 'trk_lover', title: 'Lover', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', albumId: 'alb_moonchild', albumTitle: 'MoonChild Era', artworkUrl: ALBUMS_CATALOG[6].artworkUrl, durationSec: 190, loved: true, lovedAt: 1749000000 },
  { id: 'trk_kinni_kinni', title: 'Kinni Kinni', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', albumId: 'alb_ghost', albumTitle: 'Ghost', artworkUrl: ALBUMS_CATALOG[5].artworkUrl, durationSec: 213, loved: true, lovedAt: 1752000000 },
  { id: 'trk_hass_hass', title: 'Hass Hass', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', albumId: 'alb_ghost', albumTitle: 'Ghost', artworkUrl: ALBUMS_CATALOG[5].artworkUrl, durationSec: 154, loved: false },
  { id: 'trk_born_to_shine', title: 'Born to Shine', artistId: 'art_diljit', artistName: 'Diljit Dosanjh', albumId: 'alb_moonchild', albumTitle: 'MoonChild Era', artworkUrl: ALBUMS_CATALOG[6].artworkUrl, durationSec: 202, loved: true, lovedAt: 1711000000 },

  // AP Dhillon
  { id: 'trk_excuses', title: 'Excuses', artistId: 'art_ap_dhillon', artistName: 'AP Dhillon', albumId: 'alb_hidden_gems', albumTitle: 'Hidden Gems', artworkUrl: ALBUMS_CATALOG[7].artworkUrl, durationSec: 176, loved: true, lovedAt: 1714000000 },
  { id: 'trk_summer_high', title: 'Summer High', artistId: 'art_ap_dhillon', artistName: 'AP Dhillon', albumId: 'alb_hidden_gems', albumTitle: 'Hidden Gems', artworkUrl: ALBUMS_CATALOG[7].artworkUrl, durationSec: 177, loved: false },
  { id: 'trk_with_you', title: 'With You', artistId: 'art_ap_dhillon', artistName: 'AP Dhillon', albumId: 'alb_hidden_gems', albumTitle: 'Hidden Gems', artworkUrl: ALBUMS_CATALOG[7].artworkUrl, durationSec: 155, loved: true, lovedAt: 1745000000 },

  // Fred again..
  { id: 'trk_delilah', title: 'Delilah (pull me out of this)', artistId: 'art_fred_again', artistName: 'Fred again..', albumId: 'alb_actual_life_3', albumTitle: 'Actual Life 3', artworkUrl: ALBUMS_CATALOG[8].artworkUrl, durationSec: 251, loved: true, lovedAt: 1758000000 },
  { id: 'trk_adore_u', title: 'adore u', artistId: 'art_fred_again', artistName: 'Fred again..', albumId: 'alb_ten_days', albumTitle: 'ten days', artworkUrl: ALBUMS_CATALOG[9].artworkUrl, durationSec: 220, loved: true, lovedAt: 1759000000 },
  { id: 'trk_places_to_be', title: 'places to be', artistId: 'art_fred_again', artistName: 'Fred again..', albumId: 'alb_ten_days', albumTitle: 'ten days', artworkUrl: ALBUMS_CATALOG[9].artworkUrl, durationSec: 226, loved: false },

  // The Weeknd
  { id: 'trk_after_hours', title: 'After Hours', artistId: 'art_weeknd', artistName: 'The Weeknd', albumId: 'alb_after_hours', albumTitle: 'After Hours', artworkUrl: ALBUMS_CATALOG[10].artworkUrl, durationSec: 361, loved: true, lovedAt: 1716000000 },
  { id: 'trk_blinding_lights', title: 'Blinding Lights', artistId: 'art_weeknd', artistName: 'The Weeknd', albumId: 'alb_after_hours', albumTitle: 'After Hours', artworkUrl: ALBUMS_CATALOG[10].artworkUrl, durationSec: 200, loved: false },

  // Tame Impala
  { id: 'trk_let_it_happen', title: 'Let It Happen', artistId: 'art_tame_impala', artistName: 'Tame Impala', albumId: 'alb_currents', albumTitle: 'Currents', artworkUrl: ALBUMS_CATALOG[11].artworkUrl, durationSec: 467, loved: true, lovedAt: 1742000000 },
  { id: 'trk_borderline', title: 'Borderline', artistId: 'art_tame_impala', artistName: 'Tame Impala', albumId: 'alb_currents', albumTitle: 'Currents', artworkUrl: ALBUMS_CATALOG[11].artworkUrl, durationSec: 237, loved: false },

  // Pritam & AR Rahman
  { id: 'trk_tum_se_hi', title: 'Tum Se Hi', artistId: 'art_pritam', artistName: 'Pritam', albumId: 'alb_brahmastra', albumTitle: 'Midnight Soundscapes', artworkUrl: ALBUMS_CATALOG[12].artworkUrl, durationSec: 321, loved: true, lovedAt: 1719000000 },
  { id: 'trk_kun_faya_kun', title: 'Kun Faya Kun', artistId: 'art_ar_rahman', artistName: 'A.R. Rahman', albumId: 'alb_rockstar', albumTitle: 'Rockstar Deluxe', artworkUrl: ALBUMS_CATALOG[13].artworkUrl, durationSec: 473, loved: true, lovedAt: 1751000000 },

  // Bicep & Bonobo & Khruangbin & Radiohead
  { id: 'trk_apricots', title: 'Apricots', artistId: 'art_bicep', artistName: 'Bicep', albumId: 'alb_isles', albumTitle: 'Isles', artworkUrl: ALBUMS_CATALOG[14].artworkUrl, durationSec: 246, loved: true, lovedAt: 1755000000 },
  { id: 'trk_rosewood', title: 'Rosewood', artistId: 'art_bonobo', artistName: 'Bonobo', albumId: 'alb_fragments', albumTitle: 'Fragments', artworkUrl: ALBUMS_CATALOG[15].artworkUrl, durationSec: 242, loved: true, lovedAt: 1753000000 },
  { id: 'trk_time_you_and_i', title: 'Time (You and I)', artistId: 'art_khruangbin', artistName: 'Khruangbin', albumId: 'alb_mordechai', albumTitle: 'Mordechai', artworkUrl: ALBUMS_CATALOG[16].artworkUrl, durationSec: 342, loved: false },
  { id: 'trk_weird_fishes', title: 'Weird Fishes/Arpeggi', artistId: 'art_radiohead', artistName: 'Radiohead', albumId: 'alb_in_rainbows', albumTitle: 'In Rainbows', artworkUrl: ALBUMS_CATALOG[17].artworkUrl, durationSec: 318, loved: true, lovedAt: 1713000000 },

  // Additional artists
  { id: 'trk_modern_mirza', title: 'Modern Mirza', artistId: 'art_raf_saperra', artistName: 'Raf Saperra', albumId: 'alb_ruff_around', albumTitle: 'Ruff Around the Edges', artworkUrl: ALBUMS_CATALOG[18].artworkUrl, durationSec: 196, loved: true, lovedAt: 1758500000 },
  { id: 'trk_khatta_flow', title: 'Khatta Flow', artistId: 'art_seedhe_maut', artistName: 'Seedhe Maut', albumId: 'alb_lunch_break', albumTitle: 'Lunch Break', artworkUrl: ALBUMS_CATALOG[19].artworkUrl, durationSec: 168, loved: false },
  { id: 'trk_cold_mess', title: 'cold/mess', artistId: 'art_prateek_kuhad', artistName: 'Prateek Kuhad', albumId: 'alb_cold_mess', albumTitle: 'cold/mess', artworkUrl: ALBUMS_CATALOG[20].artworkUrl, durationSec: 284, loved: true, lovedAt: 1710000000 },
  { id: 'trk_instant_crush', title: 'Instant Crush', artistId: 'art_daft_punk', artistName: 'Daft Punk', albumId: 'alb_ram', albumTitle: 'Random Access Memories', artworkUrl: ALBUMS_CATALOG[21].artworkUrl, durationSec: 337, loved: true, lovedAt: 1717000000 },
  { id: 'trk_cheques', title: 'Cheques', artistId: 'art_subbhi', artistName: 'Shubh', albumId: 'alb_still_rollin', albumTitle: 'Still Rollin', artworkUrl: ALBUMS_CATALOG[22].artworkUrl, durationSec: 188, loved: false },
  { id: 'trk_daydream_repeat', title: 'Daydream Repeat', artistId: 'art_four_tet', artistName: 'Four Tet', albumId: 'alb_three', albumTitle: 'Three', artworkUrl: ALBUMS_CATALOG[23].artworkUrl, durationSec: 368, loved: false },
  { id: 'trk_witchy', title: 'Witchy', artistId: 'art_kaytranada', artistName: 'KAYTRANADA', albumId: 'alb_timeless', albumTitle: 'TIMELESS', artworkUrl: ALBUMS_CATALOG[24].artworkUrl, durationSec: 222, loved: false },
  { id: 'trk_says', title: 'Says', artistId: 'art_nils_frahm', artistName: 'Nils Frahm', albumId: 'alb_all_melody', albumTitle: 'All Melody', artworkUrl: ALBUMS_CATALOG[25].artworkUrl, durationSec: 498, loved: true, lovedAt: 1712500000 },
  { id: 'trk_3_59_am', title: '3:59 AM', artistId: 'art_divine', artistName: 'DIVINE', albumId: 'alb_gunehgar', albumTitle: 'Gunehgar', artworkUrl: ALBUMS_CATALOG[26].artworkUrl, durationSec: 272, loved: false },
  { id: 'trk_dhundhala', title: 'Dhundhala', artistId: 'art_talwiinder', artistName: 'Talwiinder', albumId: 'alb_talwiinder_ep', albumTitle: 'Midnight Confessions', artworkUrl: ALBUMS_CATALOG[27].artworkUrl, durationSec: 194, loved: true, lovedAt: 1758800000 },
  { id: 'trk_birth4', title: 'Birth4000', artistId: 'art_floating_points', artistName: 'Floating Points', albumId: 'alb_cascade', albumTitle: 'Cascade', artworkUrl: ALBUMS_CATALOG[28].artworkUrl, durationSec: 285, loved: false },
  { id: 'trk_archangel', title: 'Archangel', artistId: 'art_burial', artistName: 'Burial', albumId: 'alb_untrue', albumTitle: 'Untrue', artworkUrl: ALBUMS_CATALOG[29].artworkUrl, durationSec: 238, loved: false },
  { id: 'trk_awake', title: 'Awake', artistId: 'art_tycho', artistName: 'Tycho', albumId: 'alb_dive', albumTitle: 'Dive', artworkUrl: ALBUMS_CATALOG[30].artworkUrl, durationSec: 283, loved: false },
  { id: 'trk_float_on', title: 'Memory Box', artistId: 'art_peter_cat', artistName: 'Peter Cat Recording Co.', albumId: 'alb_bismillah', albumTitle: 'Bismillah', artworkUrl: ALBUMS_CATALOG[31].artworkUrl, durationSec: 256, loved: false },
  { id: 'trk_husn', title: 'Husn', artistId: 'art_anuv_jain', artistName: 'Anuv Jain', albumId: 'alb_cold_mess', albumTitle: 'cold/mess', artworkUrl: createArtworkSvg('Husn', 'Anuv', '#0B132B', '#1C2541', '#5BC0BE', 'vinyl'), durationSec: 218, loved: false },
  { id: 'trk_khalasi', title: 'Khalasi', artistId: 'art_coke_studio', artistName: 'Coke Studio Bharat', albumId: 'alb_brahmastra', albumTitle: 'Midnight Soundscapes', artworkUrl: ALBUMS_CATALOG[12].artworkUrl, durationSec: 258, loved: false },
  { id: 'trk_joota_japani', title: 'Joota Japani', artistId: 'art_krsna', artistName: 'KR$NA', albumId: 'alb_lunch_break', albumTitle: 'Lunch Break', artworkUrl: ALBUMS_CATALOG[19].artworkUrl, durationSec: 172, loved: false },
  { id: 'trk_btstu', title: 'BTSTU', artistId: 'art_jai_paul', artistName: 'Jai Paul', albumId: 'alb_timeless', albumTitle: 'TIMELESS', artworkUrl: ALBUMS_CATALOG[24].artworkUrl, durationSec: 210, loved: false },
  { id: 'trk_beyond_belief', title: 'Beyond Beliefs', artistId: 'art_ben_bohmer', artistName: 'Ben Böhmer', albumId: 'alb_fragments', albumTitle: 'Fragments', artworkUrl: ALBUMS_CATALOG[15].artworkUrl, durationSec: 312, loved: false },
  { id: 'trk_emerald_rush', title: 'Emerald Rush', artistId: 'art_jon_hopkins', artistName: 'Jon Hopkins', albumId: 'alb_three', albumTitle: 'Three', artworkUrl: ALBUMS_CATALOG[23].artworkUrl, durationSec: 326, loved: false },
  { id: 'trk_clearest_blue', title: 'Clearest Blue', artistId: 'art_chvrches', artistName: 'CHVRCHES', albumId: 'alb_currents', albumTitle: 'Currents', artworkUrl: ALBUMS_CATALOG[11].artworkUrl, durationSec: 233, loved: false },
  { id: 'trk_ikky_intro', title: 'Chauffeur', artistId: 'art_ikky', artistName: 'Ikky', albumId: 'alb_making_memories', albumTitle: 'Making Memories', artworkUrl: ALBUMS_CATALOG[0].artworkUrl, durationSec: 194, loved: false },
  { id: 'trk_besharam', title: 'Horizon Drive', artistId: 'art_vishal_shekhar', artistName: 'Vishal-Shekhar', albumId: 'alb_brahmastra', albumTitle: 'Midnight Soundscapes', artworkUrl: ALBUMS_CATALOG[12].artworkUrl, durationSec: 212, loved: false },
  { id: 'trk_shreya_melody', title: 'Ve Kamleya (Studio)', artistId: 'art_shreya', artistName: 'Shreya Ghoshal', albumId: 'alb_arijit_unplugged', albumTitle: 'Soulful Nocturnes', artworkUrl: ALBUMS_CATALOG[3].artworkUrl, durationSec: 244, loved: false },
  { id: 'trk_bad_kingdom', title: 'Bad Kingdom', artistId: 'art_moderat', artistName: 'Moderat', albumId: 'alb_isles', albumTitle: 'Isles', artworkUrl: ALBUMS_CATALOG[14].artworkUrl, durationSec: 262, loved: false },
  { id: 'trk_articulation', title: 'Articulation', artistId: 'art_rival_consoles', artistName: 'Rival Consoles', albumId: 'alb_three', albumTitle: 'Three', artworkUrl: ALBUMS_CATALOG[23].artworkUrl, durationSec: 274, loved: false },
  { id: 'trk_chaiyya_chaiyya', title: 'Chaiyya Chaiyya', artistId: 'art_ar_rahman', artistName: 'A.R. Rahman', albumId: 'alb_dil_se', albumTitle: 'Dil Se.. (Original Soundtrack)', artworkUrl: ALBUMS_CATALOG[32].artworkUrl, durationSec: 395, loved: true, lovedAt: 1724000000 },
  { id: 'trk_disco_deewane', title: 'Disco Station', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_retro_80s', albumTitle: 'Midnight Disco & Soul', artworkUrl: ALBUMS_CATALOG[33].artworkUrl, durationSec: 215, loved: false },
  { id: 'trk_ye_dosti', title: 'Ye Dosti Acoustic', artistId: 'art_sanam', artistName: 'SANAM', albumId: 'alb_classics_70s', albumTitle: 'Acoustic Cinema 1975', artworkUrl: ALBUMS_CATALOG[34].artworkUrl, durationSec: 248, loved: true, lovedAt: 1728000000 },
  { id: 'trk_lag_jaa_classic', title: 'Lag Jaa Gale (Archival 1965)', artistId: 'art_shreya', artistName: 'Shreya Ghoshal', albumId: 'alb_golden_60s', albumTitle: 'Golden Ragas 1965', artworkUrl: ALBUMS_CATALOG[35].artworkUrl, durationSec: 270, loved: false },
  { id: 'trk_vintage_thumri', title: 'Vintage Thumri (Pre-1960)', artistId: 'art_shreya', artistName: 'Shreya Ghoshal', albumId: 'alb_vintage_50s', albumTitle: 'Archival Heritage Pre-1960', artworkUrl: ALBUMS_CATALOG[36].artworkUrl, durationSec: 185, loved: false },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toDateKey(epochSec: number): {
  dateKey: string;
  year: number;
  month: number;
  dayOfWeek: number;
  hourOfDay: number;
} {
  const d = new Date(epochSec * 1000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const hourOfDay = d.getUTCHours();
  const jsDay = d.getUTCDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { dateKey, year, month, dayOfWeek, hourOfDay };
}

export function buildInitialNormalizedScrobbles(includeAnomalies = true): Scrobble[] {
  const rand = mulberry32(20261004);
  const scrobbles: Scrobble[] = [];
  const tracksById = new Map<string, Track>();
  TRACKS_CATALOG.forEach((t) => tracksById.set(t.id, t));

  const tracksByArtist = new Map<string, Track[]>();
  TRACKS_CATALOG.forEach((t) => {
    const list = tracksByArtist.get(t.artistId) || [];
    list.push(t);
    tracksByArtist.set(t.artistId, list);
  });

  let idCounter = 1;
  const pushScrobble = (
    track: Track,
    epochSec: number,
    source: Scrobble['source'] = 'historical-import',
    anomalyFlag?: Scrobble['anomalyFlag'],
    nowPlaying = false
  ) => {
    const meta = toDateKey(epochSec);
    scrobbles.push({
      id: `scr_${idCounter++}`,
      trackId: track.id,
      artistId: track.artistId,
      albumId: track.albumId,
      timestamp: epochSec,
      timestampUTC: new Date(epochSec * 1000).toISOString(),
      dateKey: meta.dateKey,
      year: meta.year,
      month: meta.month,
      dayOfWeek: meta.dayOfWeek,
      hourOfDay: meta.hourOfDay,
      durationSec: track.durationSec,
      loved: track.loved,
      nowPlaying,
      source,
      anomalyFlag,
    });
  };

  const utcSec = (y: number, m: number, d: number, h: number, min = 0, s = 0) =>
    Math.floor(Date.UTC(y, m - 1, d, h, min, s) / 1000);

  // 1. Forgotten Favorite: "52 Bars" (trk_52_bars) -> 87 plays, last played March 4, 2026 (214 days before Oct 4, 2026)
  const trk52Bars = tracksById.get('trk_52_bars')!;
  for (let i = 0; i < 86; i++) {
    const dayOffset = Math.floor(rand() * 55);
    const ts = utcSec(2025, 11, 5, 19, 10) + dayOffset * 86400 + Math.floor(rand() * 7200);
    pushScrobble(trk52Bars, ts);
  }
  pushScrobble(trk52Bars, utcSec(2026, 3, 4, 21, 15));

  // 2. Old Obsession & Loved Dormant tracks (> 6 months ago, in Jan-Mar 2026)
  const dormantTracks: { id: string; count: number; lastMonth: number; lastDay: number }[] = [
    { id: 'trk_on_top', count: 64, lastMonth: 2, lastDay: 18 },
    { id: 'trk_agar_tum', count: 58, lastMonth: 3, lastDay: 11 },
    { id: 'trk_weird_fishes', count: 52, lastMonth: 2, lastDay: 24 },
    { id: 'trk_says', count: 44, lastMonth: 1, lastDay: 29 },
    { id: 'trk_cold_mess', count: 74, lastMonth: 3, lastDay: 22 },
    { id: 'trk_husn', count: 61, lastMonth: 3, lastDay: 19 },
  ];

  for (const dt of dormantTracks) {
    const trk = tracksById.get(dt.id)!;
    for (let i = 0; i < dt.count - 1; i++) {
      const m = i % 2 === 0 ? 1 : 2;
      const d = 1 + (i % 26);
      const h = 18 + (i % 5);
      pushScrobble(trk, utcSec(2026, m, d, h, (i * 7) % 55));
    }
    pushScrobble(trk, utcSec(2026, dt.lastMonth, dt.lastDay, 20, 30));
  }

  // 3. Controlled Timeline Period A: Jan 1, 2026 – Mar 31, 2026
  const q1ArtistTargets: { artistId: string; targetPlays: number; trackIds: string[] }[] = [
    { artistId: 'art_arijit_singh', targetPlays: 252, trackIds: ['trk_kesariya', 'trk_channa_mereya', 'trk_satranga'] }, // +58 = 310 (#1)
    { artistId: 'art_diljit', targetPlays: 250, trackIds: ['trk_lover', 'trk_kinni_kinni', 'trk_hass_hass', 'trk_born_to_shine'] }, // #2
    { artistId: 'art_weeknd', targetPlays: 225, trackIds: ['trk_after_hours', 'trk_blinding_lights'] }, // #3
    { artistId: 'art_ap_dhillon', targetPlays: 205, trackIds: ['trk_excuses', 'trk_summer_high', 'trk_with_you'] }, // #4
    { artistId: 'art_pritam', targetPlays: 190, trackIds: ['trk_tum_se_hi'] }, // #5
    { artistId: 'art_tame_impala', targetPlays: 175, trackIds: ['trk_let_it_happen', 'trk_borderline'] }, // #6
    { artistId: 'art_daft_punk', targetPlays: 160, trackIds: ['trk_instant_crush'] }, // #7
    { artistId: 'art_bicep', targetPlays: 145, trackIds: ['trk_apricots'] }, // #8
    { artistId: 'art_bonobo', targetPlays: 135, trackIds: ['trk_rosewood'] }, // #9
    { artistId: 'art_ar_rahman', targetPlays: 125, trackIds: ['trk_kun_faya_kun'] }, // #10
    { artistId: 'art_khruangbin', targetPlays: 118, trackIds: ['trk_time_you_and_i'] }, // #11
    { artistId: 'art_karan_aujla', targetPlays: 45, trackIds: ['trk_softly', 'trk_admirin_you', 'trk_try_me'] }, // +64 +1 = 110 (#12)
    { artistId: 'art_fred_again', targetPlays: 48, trackIds: ['trk_delilah'] }, // #16
    { artistId: 'art_sanam', targetPlays: 38, trackIds: ['trk_gulabi_aankhen', 'trk_lag_jaa_gale'] }, // #18
  ];

  const pickWeightedHour = () => {
    const r = rand();
    if (r < 0.28) return 19 + Math.floor(rand() * 3); // 19, 20, 21
    if (r < 0.46) return 22 + Math.floor(rand() * 2); // 22, 23
    if (r < 0.65) return 14 + Math.floor(rand() * 5);
    if (r < 0.85) return 9 + Math.floor(rand() * 5);
    return Math.floor(rand() * 9);
  };

  for (const item of q1ArtistTargets) {
    for (let i = 0; i < item.targetPlays; i++) {
      const m = 1 + (i % 3);
      const maxDay = m === 2 ? 28 : 31;
      let d = 1 + Math.floor(rand() * maxDay);
      const testEpoch = utcSec(2026, m, d, 12);
      const dow = toDateKey(testEpoch).dayOfWeek;
      if (dow < 4 && rand() < 0.25) {
        d = Math.min(maxDay, d + (4 - dow));
      }
      const h = pickWeightedHour();
      const min = Math.floor(rand() * 58);
      const trkId = item.trackIds[i % item.trackIds.length];
      pushScrobble(tracksById.get(trkId)!, utcSec(2026, m, d, h, min, Math.floor(rand() * 50)));
    }
  }

  // 4. April – June 2026 (Q2)
  const q2TrackWeights: { trackId: string; count: number; months: number[] }[] = [
    { trackId: 'trk_real_bad_man', count: 94, months: [5, 6] },
    { trackId: 'trk_softly', count: 88, months: [4, 5, 6] },
    { trackId: 'trk_winning_speech', count: 76, months: [4, 5, 6] },
    { trackId: 'trk_lover', count: 92, months: [4, 5, 6] },
    { trackId: 'trk_kinni_kinni', count: 84, months: [4, 5, 6] },
    { trackId: 'trk_kesariya', count: 78, months: [4, 5, 6] },
    { trackId: 'trk_delilah', count: 72, months: [4, 5, 6] },
    { trackId: 'trk_let_it_happen', count: 68, months: [4, 5, 6] },
    { trackId: 'trk_apricots', count: 64, months: [4, 5, 6] },
    { trackId: 'trk_rosewood', count: 60, months: [4, 5, 6] },
    { trackId: 'trk_gulabi_aankhen', count: 55, months: [5, 6] },
    { trackId: 'trk_with_you', count: 66, months: [4, 5] },
    { trackId: 'trk_after_hours', count: 70, months: [4, 5] },
  ];

  const q2Indices: number[] = [];
  for (const qw of q2TrackWeights) {
    const trk = tracksById.get(qw.trackId)!;
    for (let i = 0; i < qw.count; i++) {
      const m = qw.months[i % qw.months.length];
      const d = 1 + Math.floor(rand() * 28);
      const h = pickWeightedHour();
      q2Indices.push(scrobbles.length);
      pushScrobble(trk, utcSec(2026, m, d, h, Math.floor(rand() * 59)));
    }
  }

  // 5. Landmark Date: September 29, 2026 (2026-09-29)
  // 332 plays, 38 unique artists (excluding dropped Q1 artists Prateek Kuhad & Anuv Jain), Top artist: Karan Aujla, Top track: Real Bad Man
  const sep29Plays: Track[] = [];
  const trkRealBadMan = tracksById.get('trk_real_bad_man')!;
  for (let i = 0; i < 42; i++) sep29Plays.push(trkRealBadMan);
  const otherKaran = ['trk_winning_speech', 'trk_softly', 'trk_admirin_you', 'trk_try_me', 'trk_bachke_bachke'];
  for (let i = 0; i < 36; i++) {
    sep29Plays.push(tracksById.get(otherKaran[i % otherKaran.length])!);
  }
  for (const art of ARTISTS_CATALOG) {
    if (art.id === 'art_karan_aujla' || art.id === 'art_prateek_kuhad' || art.id === 'art_anuv_jain') continue;
    const artTracks = tracksByArtist.get(art.id);
    if (artTracks && artTracks.length > 0) {
      sep29Plays.push(artTracks[0]);
    }
  }
  const sep29FillerIds = [
    'trk_kinni_kinni',
    'trk_lover',
    'trk_gulabi_aankhen',
    'trk_lag_jaa_gale',
    'trk_mere_mehboob',
    'trk_adore_u',
    'trk_delilah',
    'trk_places_to_be',
    'trk_kesariya',
    'trk_satranga',
    'trk_apricots',
    'trk_rosewood',
    'trk_modern_mirza',
    'trk_dhundhala',
    'trk_khatta_flow',
    'trk_let_it_happen',
    'trk_kun_faya_kun',
    'trk_tum_se_hi',
    'trk_witchy',
    'trk_daydream_repeat',
    'trk_birth4',
  ];
  let fillerIdx = 0;
  while (sep29Plays.length < 332) {
    const tid = sep29FillerIds[fillerIdx % sep29FillerIds.length];
    sep29Plays.push(tracksById.get(tid)!);
    fillerIdx++;
  }

  let sep29Cursor = utcSec(2026, 9, 29, 6, 5, 0);
  for (let i = 0; i < sep29Plays.length; i++) {
    const trk = sep29Plays[i];
    pushScrobble(trk, sep29Cursor, 'historical-import');
    sep29Cursor += 188 + (i % 9) * 4;
  }

  // 6. Controlled Timeline Period B: Jul 1, 2026 – Sep 30, 2026 (Q3)
  const q3AdditionalTargets: { artistId: string; targetPlays: number; trackIds: string[] }[] = [
    { artistId: 'art_diljit', targetPlays: 410, trackIds: ['trk_kinni_kinni', 'trk_lover', 'trk_hass_hass'] }, // #1
    { artistId: 'art_karan_aujla', targetPlays: 332, trackIds: ['trk_winning_speech', 'trk_softly', 'trk_admirin_you', 'trk_try_me', 'trk_bachke_bachke', 'trk_real_bad_man'] }, // #2 (+10 from #12)
    { artistId: 'art_sanam', targetPlays: 315, trackIds: ['trk_gulabi_aankhen', 'trk_lag_jaa_gale', 'trk_mere_mehboob', 'trk_o_mere_dil'] }, // #3 (+15 from #18)
    { artistId: 'art_fred_again', targetPlays: 270, trackIds: ['trk_adore_u', 'trk_delilah', 'trk_places_to_be'] }, // #4
    { artistId: 'art_arijit_singh', targetPlays: 248, trackIds: ['trk_kesariya', 'trk_satranga', 'trk_channa_mereya'] }, // #5 (-4 from #1)
    { artistId: 'art_bicep', targetPlays: 210, trackIds: ['trk_apricots'] }, // #6
    { artistId: 'art_raf_saperra', targetPlays: 180, trackIds: ['trk_modern_mirza'] }, // #7 (NEW)
    { artistId: 'art_talwiinder', targetPlays: 162, trackIds: ['trk_dhundhala'] }, // #8 (NEW)
    { artistId: 'art_bonobo', targetPlays: 145, trackIds: ['trk_rosewood'] },
    { artistId: 'art_tame_impala', targetPlays: 132, trackIds: ['trk_let_it_happen', 'trk_borderline'] },
    { artistId: 'art_ap_dhillon', targetPlays: 118, trackIds: ['trk_excuses', 'trk_summer_high'] },
    { artistId: 'art_seedhe_maut', targetPlays: 102, trackIds: ['trk_khatta_flow'] },
    { artistId: 'art_ar_rahman', targetPlays: 88, trackIds: ['trk_kun_faya_kun'] },
    { artistId: 'art_pritam', targetPlays: 76, trackIds: ['trk_tum_se_hi'] },
    { artistId: 'art_kaytranada', targetPlays: 68, trackIds: ['trk_witchy'] },
    { artistId: 'art_four_tet', targetPlays: 62, trackIds: ['trk_daydream_repeat'] },
    { artistId: 'art_floating_points', targetPlays: 54, trackIds: ['trk_birth4'] },
  ];

  for (const item of q3AdditionalTargets) {
    for (let i = 0; i < item.targetPlays; i++) {
      const m = 7 + (i % 3);
      let d = 1 + Math.floor(rand() * 28);
      if (m === 9 && (d === 29 || d === 14)) d = 27;
      const testEpoch = utcSec(2026, m, d, 19);
      const dow = toDateKey(testEpoch).dayOfWeek;
      if (dow !== 4 && rand() < 0.28) {
        const diff = 4 - dow;
        if (d + diff >= 1 && d + diff <= 28 && !(m === 9 && (d + diff === 29 || d + diff === 14))) {
          d += diff;
        }
      }
      const h = pickWeightedHour();
      const min = Math.floor(rand() * 58);
      const trkId = item.trackIds[i % item.trackIds.length];
      const actualTrkId = trkId === 'trk_real_bad_man' && m < 9 ? 'trk_winning_speech' : trkId;
      pushScrobble(tracksById.get(actualTrkId)!, utcSec(2026, m, d, h, min, Math.floor(rand() * 50)));
    }
  }

  // 7. September 14, 2026 ("What was I listening to on September 14?")
  const sep14SessionTracks = [
    'trk_winning_speech',
    'trk_softly',
    'trk_gulabi_aankhen',
    'trk_lag_jaa_gale',
    'trk_adore_u',
    'trk_delilah',
    'trk_kinni_kinni',
    'trk_apricots',
    'trk_rosewood',
    'trk_modern_mirza',
  ];
  let sep14Ts = utcSec(2026, 9, 14, 20, 10, 0);
  for (const tid of sep14SessionTracks) {
    const trk = tracksById.get(tid)!;
    pushScrobble(trk, sep14Ts, 'historical-import');
    sep14Ts += trk.durationSec + 12;
  }

  // 8. Recent days: Oct 1, Oct 2, Oct 3 ("last night"), and Oct 4, 2026
  const octRecentSchedule: { month: number; day: number; hour: number; min: number; trackId: string }[] = [
    { month: 10, day: 1, hour: 18, min: 15, trackId: 'trk_softly' },
    { month: 10, day: 1, hour: 18, min: 19, trackId: 'trk_winning_speech' },
    { month: 10, day: 1, hour: 18, min: 24, trackId: 'trk_gulabi_aankhen' },
    { month: 10, day: 1, hour: 21, min: 5, trackId: 'trk_adore_u' },
    { month: 10, day: 1, hour: 21, min: 10, trackId: 'trk_delilah' },
    { month: 10, day: 2, hour: 19, min: 30, trackId: 'trk_real_bad_man' },
    { month: 10, day: 2, hour: 19, min: 34, trackId: 'trk_modern_mirza' },
    { month: 10, day: 2, hour: 19, min: 38, trackId: 'trk_kinni_kinni' },
    { month: 10, day: 2, hour: 20, min: 12, trackId: 'trk_lag_jaa_gale' },
    { month: 10, day: 2, hour: 20, min: 17, trackId: 'trk_kesariya' },
    { month: 10, day: 2, hour: 22, min: 40, trackId: 'trk_apricots' },
    { month: 10, day: 3, hour: 20, min: 4, trackId: 'trk_real_bad_man' },
    { month: 10, day: 3, hour: 20, min: 8, trackId: 'trk_winning_speech' },
    { month: 10, day: 3, hour: 20, min: 12, trackId: 'trk_softly' },
    { month: 10, day: 3, hour: 20, min: 16, trackId: 'trk_admirin_you' },
    { month: 10, day: 3, hour: 20, min: 21, trackId: 'trk_gulabi_aankhen' },
    { month: 10, day: 3, hour: 20, min: 25, trackId: 'trk_lag_jaa_gale' },
    { month: 10, day: 3, hour: 21, min: 14, trackId: 'trk_adore_u' },
    { month: 10, day: 3, hour: 21, min: 19, trackId: 'trk_delilah' },
    { month: 10, day: 3, hour: 21, min: 24, trackId: 'trk_rosewood' },
    { month: 10, day: 3, hour: 21, min: 29, trackId: 'trk_dhundhala' },
    { month: 10, day: 3, hour: 22, min: 2, trackId: 'trk_let_it_happen' },
    { month: 10, day: 3, hour: 22, min: 10, trackId: 'trk_kun_faya_kun' },
    { month: 10, day: 4, hour: 6, min: 42, trackId: 'trk_winning_speech' },
    { month: 10, day: 4, hour: 6, min: 46, trackId: 'trk_softly' },
    { month: 10, day: 4, hour: 6, min: 50, trackId: 'trk_adore_u' },
    { month: 10, day: 4, hour: 6, min: 55, trackId: 'trk_gulabi_aankhen' },
    { month: 10, day: 4, hour: 7, min: 1, trackId: 'trk_kinni_kinni' },
    { month: 10, day: 4, hour: 7, min: 8, trackId: 'trk_real_bad_man' },
  ];

  for (let i = 0; i < octRecentSchedule.length; i++) {
    const s = octRecentSchedule[i];
    const isLast = i === octRecentSchedule.length - 1;
    pushScrobble(
      tracksById.get(s.trackId)!,
      utcSec(2026, s.month, s.day, s.hour, s.min, 12),
      'incremental-sync',
      undefined,
      isLast
    );
  }

  // 9. Historical 2025 baseline (Oct–Dec 2025)
  const hist2025Tracks = [
    'trk_kesariya',
    'trk_channa_mereya',
    'trk_lover',
    'trk_born_to_shine',
    'trk_excuses',
    'trk_after_hours',
    'trk_blinding_lights',
    'trk_let_it_happen',
    'trk_tum_se_hi',
    'trk_kun_faya_kun',
    'trk_instant_crush',
    'trk_softly',
    'trk_chaiyya_chaiyya',
    'trk_disco_deewane',
    'trk_ye_dosti',
    'trk_lag_jaa_classic',
    'trk_vintage_thumri',
  ];
  for (let m = 10; m <= 12; m++) {
    for (let d = 1; d <= 28; d++) {
      const dailyCount = 8 + Math.floor(rand() * 14);
      for (let k = 0; k < dailyCount; k++) {
        const tid = hist2025Tracks[(d + k) % hist2025Tracks.length];
        const h = pickWeightedHour();
        q2Indices.push(scrobbles.length);
        pushScrobble(tracksById.get(tid)!, utcSec(2025, m, d, h, (k * 6) % 58));
      }
    }
  }

  // 10. Optional Integrity Anomalies
  if (includeAnomalies && q2Indices.length > 0) {
    const baseLen = scrobbles.length;
    const duplicateCount = Math.round(baseLen * 0.018);
    const rapidCount = Math.round(baseLen * 0.009);

    for (let i = 0; i < duplicateCount; i++) {
      const target = scrobbles[q2Indices[(i * 13) % q2Indices.length]];
      const trk = tracksById.get(target.trackId)!;
      pushScrobble(trk, target.timestamp + 1, 'historical-import', 'duplicate_timestamp');
    }

    for (let i = 0; i < rapidCount; i++) {
      const target = scrobbles[q2Indices[(i * 19 + 7) % q2Indices.length]];
      const trk = tracksById.get(target.trackId)!;
      pushScrobble(trk, target.timestamp + 8, 'historical-import', 'rapid_interval');
    }
  }

  scrobbles.sort((a, b) => b.timestamp - a.timestamp);
  return scrobbles;
}

export const INITIAL_SYNC_STATE: SyncState = {
  status: 'synced',
  lastSyncedAt: Math.floor(Date.UTC(2026, 9, 4, 7, 12, 0) / 1000),
  latestScrobbleTimestamp: Math.floor(Date.UTC(2026, 9, 4, 7, 8, 12) / 1000),
  importedScrobblesCount: 0,
  totalAvailableRemote: 0,
  currentPage: 1,
  totalPages: 1,
  isIncremental: true,
  errorMessage: null,
  databaseSizeKB: 1840,
  derivedAnalyticsUpdatedAt: Math.floor(Date.UTC(2026, 9, 4, 7, 12, 5) / 1000),
};
