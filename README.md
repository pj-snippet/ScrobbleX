# ScrobbleX Developer Architecture & Maintenance Guide

ScrobbleX is a React 19 + TypeScript web application packaged for Android with
Capacitor 8. Vite builds the web assets; the Android project hosts those assets
in a native WebView. Last.fm requests that require signing or a session key go
through a Supabase Edge Function.

This guide documents the checked-in implementation, not a proposed future
architecture. In particular, app startup currently loads the complete local
scrobble history into root React state for analytics; only the History feed
uses page-at-a-time IndexedDB reads.

## Contents

- [Architecture at a glance](#architecture-at-a-glance)
- [Repository structure](#repository-structure)
- [Layers and ownership](#layers-and-ownership)
- [Data flow](#data-flow)
- [Where application data lives](#where-application-data-lives)
- [Screens and their data](#screens-and-their-data)
- [Analytics architecture](#analytics-architecture)
- [Listening time - important](#listening-time---important)
- [Local persistence and performance](#local-persistence-and-performance)
- [Supabase database](#supabase-database)
- [Last.fm Edge Function](#lastfm-edge-function)
- [Where do I change this?](#where-do-i-change-this)
- [Do not break these](#do-not-break-these)
- [Environment configuration](#environment-configuration)
- [Development and Android workflow](#development-and-android-workflow)
- [Generated files](#generated-files)
- [Known limitations and pending verification](#known-limitations-and-pending-verification)

## Architecture at a glance

```text
Last.fm
  | signed API calls, authorization, now-playing, track.getInfo
  v
Supabase Edge Function: lastfm
  | PostgREST requests using server-side service credentials
  v
Supabase PostgreSQL
  | raw scrobbles, encrypted Last.fm connection, sync checkpoint,
  | canonical track metadata
  v
React client
  | syncService -> IndexedDB repository -> application state
  |                                                   |
  |                                                   +-> analytics services
  |                                                   +-> screen-specific UI
  +-> localStorage: auth session, username, preferences

Capacitor Android WebView
  +-> loads the Vite dist/ bundle copied into android/app/src/main/assets/public/
```

The local IndexedDB scrobble store is the client-side history cache. Supabase
also stores the imported raw scrobbles so the app can restore history after
local data is cleared. Analytics are calculated on the client from the
scrobbles; no aggregate tables or analytics views currently exist in the
migrations.

## Repository structure

### Source code (`src/`)

```text
src/
|-- app/
|   |-- App.tsx
|   |-- components/
|   |   |-- AppHeader.tsx
|   |   |-- AppScreenRouter.tsx
|   |   |-- MoreFeaturesMenu.tsx
|   |   `-- PrimaryNavigation.tsx
|   `-- navigation/appTabs.ts
|-- components/
|   |-- common/EntityDetailSheet.tsx
|   `-- ui/MobilePrimitives.tsx
|-- data/
|   |-- catalog/musicCatalog.ts
|   `-- local/scrobbleRepository.ts
|-- features/
|   |-- analytics/
|   |   |-- hooks/useTrackDurationBackfill.ts
|   |   `-- services/
|   |       |-- activityAnalytics.ts
|   |       |-- analyticsCore.ts
|   |       |-- analyticsEngine.ts
|   |       |-- calendarActivityAnalytics.ts
|   |       |-- chartAnalytics.ts
|   |       |-- entityAnalytics.ts
|   |       |-- fingerprintAnalytics.ts
|   |       |-- integrityAnalytics.ts
|   |       |-- listeningClockAnalytics.ts
|   |       |-- listeningSessionsAnalytics.ts
|   |       |-- listeningStoryAnalytics.ts
|   |       |-- listeningSummary.ts
|   |       |-- monthlyAnalytics.ts
|   |       |-- musicRatioAnalytics.ts
|   |       |-- rediscoverAnalytics.ts
|   |       |-- timelineAnalytics.ts
|   |       |-- trackDurationEnrichment.ts
|   |       |-- weeklyHeatmapAnalytics.ts
|   |       `-- yearInReviewAnalytics.ts
|   |-- lastfm/
|   |   |-- api/lastfmApi.ts
|   |   `-- hooks/useLastFmAuthorization.ts
|   |-- listening-story/ListeningStoryModal.tsx
|   |-- sync/services/syncService.ts
|   |-- telemetry/
|   |   |-- components/LiveTelemetryCard.tsx
|   |   |-- hooks/useLivePlayback.ts
|   |   `-- utils/telemetrySelectors.ts
|   `-- themes/themeRegistry.ts
|-- screens/
|   |-- activity/ActivityScreen.tsx
|   |-- charts/
|   |   |-- ChartsScreen.tsx
|   |   `-- hooks/useChartsData.ts
|   |-- history/
|   |   |-- HistoryAndSearchScreen.tsx
|   |   `-- hooks/useListeningHistory.ts
|   |-- home/
|   |   |-- HomeScreen.tsx
|   |   |-- hooks/useHomeData.ts
|   |   `-- components/
|   |       |-- ListeningStoryBanner.tsx
|   |       |-- OverviewStats.tsx
|   |       |-- QuickNavigation.tsx
|   |       |-- RecentScrobblesPreview.tsx
|   |       `-- TopRankings.tsx
|   |-- loved/LovedAndTrustScreen.tsx
|   |-- profile/ProfileScreen.tsx
|   |-- rediscover/RediscoverScreen.tsx
|   |-- settings/SettingsScreen.tsx
|   `-- timeline/TimelineScreen.tsx
|-- types/music.ts
|-- utils/tempPerformance.ts
|-- index.css
|-- main.tsx
`-- vite-env.d.ts
```

### Server and platform code

```text
supabase/
|-- config.toml
|-- functions/lastfm/index.ts
|-- migrations/
|   |-- 20261005000000_create_lastfm_connections.sql
|   |-- 20261005001000_add_scrobble_sync.sql
|   |-- 20261005002000_harden_rls_and_sync_checkpoints.sql
|   `-- 20261005003000_add_track_duration_metadata.sql
`-- tests/database/rls.test.sql

android/
|-- app/
|   |-- build.gradle
|   `-- src/main/
|       |-- AndroidManifest.xml
|       |-- java/com/scrobblex/app/MainActivity.java
|       |-- res/                         (native app icons and launch resources)
|       `-- assets/public/               (generated Capacitor web bundle)
|-- build.gradle
|-- gradlew.bat
|-- settings.gradle
`-- variables.gradle
```

### Root configuration

- `package.json` and `package-lock.json`: JavaScript dependencies and npm
  scripts.
- `capacitor.config.ts`: Capacitor app ID, display name, and `dist` web
  directory.
- `vite.config.ts`: React/Tailwind Vite plugins, dev/preview ports, and path
  alias.
- `tsconfig.json`: TypeScript compiler settings for `src/`.
- `.env.example`: names and placeholders for public client configuration.
- `index.html`, `metadata.json`: web document entry and project metadata.

There is no root `public/` directory in the current tree. The committed or
generated-looking files under `android/app/src/main/assets/public/` are the
Capacitor copy of the web build and are not the source of the React UI.

## Layers and ownership

| Layer | Responsibility | Current examples | Keep out of this layer |
|---|---|---|---|
| App shell | Own top-level state, sync lifecycle, theming, modal state, and screen composition | `src/app/App.tsx`, `src/app/components/` | Last.fm request signing, SQL, detailed analytics algorithms |
| Screens and UI | Present feature content and collect user input | `src/screens/`, `src/components/` | Direct secrets, direct database schema logic, duplicated analytics |
| Feature hooks/services | Coordinate a feature's API use, lifecycle, and calculations | `src/features/sync/`, `src/features/lastfm/`, `src/features/telemetry/`, `src/features/analytics/` | Native Android UI implementation |
| Local data | Persist and query browser-side scrobbles and track metadata | `src/data/local/scrobbleRepository.ts` | Last.fm secret handling |
| Server | Authenticate requests, sign Last.fm calls, encrypt session keys, and access cloud tables | `supabase/functions/lastfm/index.ts` | Client UI state |
| Database | Persist raw cloud records and checkpoints with constraints and RLS | `supabase/migrations/` | Client-side preference state |
| Android wrapper | Host the web build and native launch resources | `android/`, `capacitor.config.ts` | React feature logic |

The client does not use a Supabase JavaScript SDK. `lastfmApi.ts` uses `fetch`
for Supabase Auth and the Edge Function; the Edge Function uses `fetch` against
Last.fm and Supabase REST endpoints.

## Data flow

### Last.fm authorization and sync

1. `useLastFmAuthorization` requests an auth start from
   `lastfmApi.ts`. The Edge Function obtains a Last.fm token and creates a
   random state value; only its hash and a short-lived request record are
   stored in `lastfm_auth_requests`.
2. The client opens the function's redirect URL. The function sends the
   browser to Last.fm. On return, the Settings flow completes the authorization
   through the function.
3. The function exchanges the token for a Last.fm session. It encrypts the
   session key with AES-GCM and stores the encrypted value and IV in
   `lastfm_connections`. The shared secret and session key remain server-side.
4. `App.tsx` calls `runScrobbleSync` in `syncService.ts`. If the local scrobble
   count is zero, the service first restores pages of up to 200 rows from the
   user's cloud scrobbles. It then requests Last.fm pages through the function.
5. The Edge Function requests `user.getRecentTracks` with `limit=200`, filters
   invalid/now-playing records, normalizes entity IDs and event IDs, and
   upserts a page using conflict-ignore semantics.
6. The client inserts each returned page into IndexedDB in a transaction.
   Duplicate key violations are ignored. The next `sync-page` request carries
   the acknowledged page number; the function advances the server checkpoint
   only after the client has persisted the previous page. An unacknowledged
   page may be replayed safely.
7. A new sync uses the server's `newest_imported_at` watermark with a 120-second
   overlap. Requests are sequential, capped at 200 tracks, and the Last.fm
   client retries transient network, service, and rate-limit failures at most
   three times with bounded backoff.
8. After the sync completes, `App.tsx` merges the returned records into its
   descending-timestamp React array and starts duration backfill. Sync progress
   callbacks update status as pages are acknowledged; the main scrobble array
   is not replaced on every page.

The sync checkpoint is in Supabase, not localStorage. The local `last
successful sync` timestamp is used by the foreground scheduler; it is not the
authoritative imported-scrobble watermark.

Scrobble `event_id` is a SHA-256 digest based on the play timestamp and
normalized track/artist/album identity. Together with the `(user_id, event_id)`
primary key and conflict-ignore inserts, this prevents a replayed page from
creating duplicate rows.

### Track duration enrichment

```text
local scrobbles
  -> distinct missing track IDs (per user history/cache)
  -> batches of at most 10 requests
  -> authenticated lastfm Edge Function
  -> Last.fm track.getInfo
  -> duration milliseconds converted to whole seconds
  -> Supabase track_metadata and IndexedDB trackMetadata
  -> shared analytics duration resolver
  -> Home / Activity / Charts / Timeline / entity details / Story
```

Recent-track data does not reliably include track duration, so it is not used
as a complete duration source. Positive metadata is reused. A no-result lookup
is persisted with a check time and can be retried after 30 days. Missing or
unresolvable duration stays unknown; transient failures are not treated as a
valid duration. The client deduplicates metadata requests by canonical track ID
and sends batches of up to 10. Completed batches are persisted, so already
resolved tracks do not need to be fetched again on the next run.

### Live Telemetry

`useLivePlayback` requests `now-playing` from the Edge Function while the Home
tab is active and the document is visible. It polls every 20 seconds, coalesces
in-flight requests, and applies a short event cooldown. The function calls
`user.getRecentTracks` with a limit of one and returns a track only when
Last.fm marks it `nowplaying`.

Now-playing is transient playback state. It is not a completed scrobble and is
not inserted into the scrobble history by this flow. A recent completed
scrobble can be shown separately when there is no current track.

### Automatic Live Sync

`App.tsx` owns automatic history sync. When a Last.fm username exists and local
history has loaded, a visible app schedules a sync every five minutes. If the
page becomes hidden, the scheduled timer is cleared; visibility restoration
causes the next check to be scheduled. One in-flight guard protects both
automatic and manual requests. Manual Sync Now uses the same `runScrobbleSync`
path.

This is a foreground JavaScript timer, not an Android background worker. If the
WebView is suspended, the timer cannot run on schedule; sync resumes when the
app becomes active again. Server checkpoints and idempotent inserts make the
next run resumable.

### Startup, analytics, and screen state

At startup, `App.tsx` concurrently reads all local scrobbles, scans the
scrobble store to estimate serialized byte size, and reads all cached track
duration metadata. It registers entity metadata in in-memory maps, applies
cached duration values, sorts the scrobbles newest-first, and puts the complete
array into root React state. That array is passed to most screens and the
entity detail and Story modals.

Home, Activity, Charts, Profile, Timeline, Rediscover, and Loved/Trust perform
client-side calculations from that array. React `useMemo` is used in several
screen hooks, but it is local to each mounted component and keyed to that
component's inputs. There is no shared persisted analytics aggregate cache.

History is the exception for its scrobble list: it reads 30-row pages from
IndexedDB using the timestamp index and a cursor. Its textual filter is applied
while traversing those cursor rows. The separate Search mode searches the
in-memory artist, album, and track metadata maps, which are populated from the
full history at startup.

## Where application data lives

| Data | Source of truth | Persistence/cache | Consumers |
|---|---|---|---|
| Completed scrobbles | Last.fm history imported into the user's cloud rows | Supabase `scrobbles`; local IndexedDB `scrobbles` cache | Sync, analytics, History, entity details |
| Track/artist/album descriptive metadata | Last.fm scrobble payloads plus the in-memory registry | Entity maps in `analyticsCore.ts`; scrobble fields in both stores | Search, rankings, detail sheets, charts |
| Track duration | Last.fm `track.getInfo` result | Supabase `track_metadata`; IndexedDB `trackMetadata`; current in-memory track map | Shared duration analytics and duration UI |
| Sync checkpoint | Edge Function sync state | Supabase `scrobble_sync_state` | Edge Function and sync client |
| Last.fm connection | Last.fm authorization/session | Encrypted session key in Supabase `lastfm_connections`; username in client localStorage | Edge Function; app shell and Settings |
| Supabase Auth session | Supabase Auth | `scrobblex_supabase_session` in localStorage | `lastfmApi.ts` |
| User profile | Local app state/default profile and connected username | React state; username in localStorage | Profile and screen shell |
| Loved-track selection | Client preference, not a cloud Last.fm operation | `scrobblex_loved_track_ids` in localStorage | Home, detail sheet, Loved/Trust, Rediscover |
| Theme choices | Client preference | Accent, base theme, and custom hex in localStorage | App shell and screens |
| Live playback | Current Last.fm response | React state only | Home telemetry card |
| Story preset/open state | Current UI interaction | React state only | Listening Story modal |
| Analytics results | Derived from raw scrobbles and canonical track metadata | Component-level `useMemo` where used; not persisted | Screens and modals |

The catalog in `musicCatalog.ts` currently initializes empty artist, album, and
track arrays. Profile fields other than the connected username/display name
are initialized to empty defaults in the current app flow.

## Screens and their data

| Screen | UI entry | Data/calculation | Current data scope |
|---|---|---|---|
| Home | `screens/home/HomeScreen.tsx` | `useHomeData.ts` calculates selected-period overview and top artist/track/album lists; recent preview uses the root array; includes live telemetry | Full scrobble array in root state |
| Profile | `screens/profile/ProfileScreen.tsx` | Lifetime overview plus profile display fields and curated track lookups | Full scrobble array |
| Activity | `screens/activity/ActivityScreen.tsx` | Daily calendar, weekly heatmap, listening sessions/insights | Full array scanned by analytics, then filtered by year/period |
| Charts | `screens/charts/ChartsScreen.tsx` | `useChartsData.ts`: music ratio, fingerprint, and listening clock | Full array passed; calculations filter selected period in JavaScript |
| Timeline | `screens/timeline/TimelineScreen.tsx` | Monthly/yearly play, duration, coverage, unique entity, and top-entity summaries | Full scrobble array; no separate database aggregate |
| History | `screens/history/HistoryAndSearchScreen.tsx` | `useListeningHistory.ts` retrieves 30 scrobbles at a time; cursor pagination and date/text filters | Paged list; cursor traverses IndexedDB |
| Search | `HistoryAndSearchScreen.tsx` in Search mode | Case-insensitive substring matching across loaded artist/album/track maps; History mode also filters scrobbles | Metadata maps originate from full startup history; no full-text index |
| Rediscover | `screens/rediscover/RediscoverScreen.tsx` | Groups plays by track, finds dormant/returning candidates, and ranks them | Full scrobble array |
| Loved Tracks / Integrity | `screens/loved/LovedAndTrustScreen.tsx` | Loved-track analysis and listening-integrity report | Full array plus local loved-track ID set |
| Settings | `screens/settings/SettingsScreen.tsx` | Last.fm authorization/disconnect, manual sync, theme, local reset/export | App-level actions and preference state |
| Listening Story | `features/listening-story/ListeningStoryModal.tsx` | `getStoryData` builds recap cards for selected period | Full array passed from root |

Timeline is implemented in the screen and analytics layer named above. Avoid
changing its data model or behavior as a side effect of work on another screen.

## Analytics architecture

Analytics calculations belong in `src/features/analytics/services/`, not in
screen JSX. `analyticsCore.ts` holds shared metadata maps, period filtering,
formatting, and the canonical duration resolver. The two barrel modules preserve
existing imports: `analyticsEngine.ts` re-exports the service modules and
`chartAnalytics.ts` re-exports the chart-specific calculations.

| File | Owns | Main consumers |
|---|---|---|
| `analyticsCore.ts` | In-memory artist/album/track maps, registration, time-range filtering, date/time formatting, shared duration totals | All analytics; startup registration |
| `listeningSummary.ts` | Overview counts, streaks, duration, and top artist/track/album rankings | Home, Profile, entities, Story, year review |
| `calendarActivityAnalytics.ts` | Daily/year calendar buckets, active days, peak day, intensity | Activity |
| `weeklyHeatmapAnalytics.ts` | Day/hour window buckets, top entities, weekly patterns | Activity and Activity insights |
| `listeningSessionsAnalytics.ts` | Session grouping by timestamp gap and Activity insights | Activity, Story |
| `monthlyAnalytics.ts` | Per-month timeline metrics and last-12-month play series | Timeline, entity details |
| `entityAnalytics.ts` | Track/artist/album detail reports and loved-track analysis | `EntityDetailSheet`, Loved/Trust |
| `integrityAnalytics.ts` | Listening anomaly/trust report | Loved/Trust |
| `musicRatioAnalytics.ts` | Music mix/rhythm report | Charts |
| `fingerprintAnalytics.ts` | Listening behavior dimensions/archetype | Charts, Story |
| `listeningClockAnalytics.ts` | Hour-of-day counts, duration, top items, and day-part ratios | Charts, Story |
| `rediscoverAnalytics.ts` | Historical track grouping, dormancy, return categories, ranking | Rediscover, Story |
| `timelineAnalytics.ts` | Period comparison report | Exported through analytics barrel; inspect callers before changing |
| `yearInReviewAnalytics.ts` | Year totals, monthly/quarter shifts, peak day | Exported through analytics barrel; inspect callers before changing |
| `listeningStoryAnalytics.ts` | Story-period selection and recap data assembled from shared services | Listening Story modal |
| `trackDurationEnrichment.ts` | Local metadata registration, missing-track batching, persistence, cache application | App startup and post-sync backfill |
| `analyticsEngine.ts` | Re-export barrel | Existing feature imports |
| `chartAnalytics.ts` | Re-export barrel for music ratio, fingerprint, and clock modules | Charts, Story |
| `activityAnalytics.ts` | Re-export barrel for calendar, heatmap, and sessions modules | Activity, Story |

Most view calculations use `useMemo` at the screen or hook boundary. This avoids
some recomputation during unrelated renders, but it is not a global cache:
changing the scrobble array invalidates dependent calculations, and separate
screens may independently reduce the same history.

### Important calculation rules

- Period filtering is in `analyticsCore.ts`; its reference time is captured
  when the module is evaluated.
- Listening duration uses canonical track metadata and preserves the count of
  plays with unknown durations.
- Session membership uses a timestamp inactivity gap (currently 25 minutes by
  default); session listening duration is the sum of known track durations.
- Activity calendar/heatmap group by the date/hour fields on scrobbles.
- Timeline groups source scrobbles into year/month summaries in
  `monthlyAnalytics.ts`.
- Before changing any shared calculation, inspect its consumers in the
  analytics barrel and the relevant screen hook. Do not create a screen-local
  duplicate.

## Listening time - important

- `user.getRecentTracks` does not reliably supply duration. The app enriches
  unique tracks using Last.fm's official `track.getInfo` request.
- The canonical metadata key is a track ID scoped to the user in Supabase and
  track ID in the local IndexedDB `trackMetadata` store.
- Last.fm returns duration in milliseconds; the Edge Function converts
  positive values to seconds before caching.
- Known durations are reused. Unknown values remain unknown and are reported
  with unknown-play coverage. The app does not estimate duration.
- Timestamp gaps are **not** listening time. They are only used to decide
  whether plays belong to the same listening session.
- Home, Activity, Charts, Timeline, entity detail views, and Story use the
  shared duration resolver or reports built on it.
- To change lookup/caching behavior, inspect
  `trackDurationEnrichment.ts`, `useTrackDurationBackfill.ts`,
  `lastfmApi.ts`, the `track-durations` action in the Edge Function, and the
  track-metadata migration together.
- For a backend release that introduces `track_metadata`, deploy the updated
  `lastfm` Edge Function first, apply
  `supabase/migrations/20261005003000_add_track_duration_metadata.sql`, then
  publish the client that calls `track-durations`.
- To change presentation or totals, update the shared analytics service and
  the consuming screen; do not add estimated values to a component.

## Local persistence and performance

`scrobbleRepository.ts` opens IndexedDB database `scrobblex-local`, schema
version 3:

- `scrobbles`: primary key `id` (normalized as `user_id:event_id`), indexes
  `byTimestampId` (timestamp and ID), `byTrackTimestamp`,
  `byArtistTimestamp`, `byAlbumTimestamp`, and `byDate`.
- `trackMetadata`: primary key `trackId`; stores canonical track ID/MBID,
  names, nullable duration seconds, and last-check time.

Imported scrobbles are inserted as a batch inside one IndexedDB transaction;
primary-key duplicates are ignored. History paging is cursor-based, newest
first, with 30 records requested by the screen (repository maximum 200). The
repository exposes other indexed query helpers, but current screen wiring uses
the history page method for the History feed.

Performance-sensitive current behavior:

- Startup uses `getAllScrobblesForAnalytics()` and sorts all records into root
  React state. Startup also scans every scrobble to calculate a serialized
  byte estimate.
- Most analytics and detail screens receive the complete root array. Filtering,
  grouping, and ranking are JavaScript array/map operations.
- History renders page-sized batches, but its text and date filtering walks
  timestamp-ordered cursor records; there is no dedicated full-text index or
  virtualized list in the current implementation.
- Global Search filters the in-memory entity maps, not a Supabase search
  endpoint.
- Duration metadata is cached and batched by distinct track; the Edge Function
  enforces batches of 1-10 tracks. Do not request it once per scrobble.
- Sync uses 200-record API pages and bulk cloud/local writes, sequentially, to
  preserve stable pagination and resumability.
- Temporary profiling instrumentation is still present. Client and Edge
  Function measurements are emitted with the `[TEMP PERF]` prefix. Do not treat
  timings as benchmark results without measuring on the target device and
  deployment.

There are no persisted daily/monthly/artist/album/track aggregate tables or
views in the current migrations.

## Supabase database

The schema is created by the ordered files in `supabase/migrations/`. All
application-owned rows are associated with the anonymous Supabase Auth user;
foreign keys to `auth.users` cascade on deletion.

| Table | Purpose and important columns | Access notes |
|---|---|---|
| `public.lastfm_connections` | `user_id` primary/foreign key, Last.fm username, encrypted session key, IV, connection/update timestamps | RLS enabled; client roles are revoked; Edge Function uses service role and filters by authenticated user ID |
| `public.lastfm_auth_requests` | Hashed one-time state primary key, user ID, Last.fm token, created and expiry timestamps | RLS enabled; server-only table for auth handoff; expired rows are cleaned by the function |
| `public.scrobbles` | Composite primary key `(user_id, event_id)`; stable track/artist/album IDs and names, MBIDs, `played_at`, loved/artwork/source metadata | RLS enabled; authenticated CRUD grants are scoped by `auth.uid() = user_id`; sync ingestion uses the Edge Function |
| `public.scrobble_sync_state` | One row per user; status/mode, page counters, imported timestamp bounds, pending page bounds, `last_sync_at`, range, counts, and last error | RLS enabled; app roles have no table grants after hardening; Edge Function owns checkpoint operations |
| `public.track_metadata` | Composite primary key `(user_id, track_id)`; MBID, artist/track names, nullable `duration_sec`, and `checked_at` | RLS enabled; service role reads/writes through the Edge Function; migration also defines an own-row SELECT policy |

The current migration sequence removes `duration_sec` from `scrobbles` after
copying only consistent positive per-track durations into `track_metadata`.
There are no aggregate tables, analytics views, stored analytics functions, or
database search index in the current migrations. The `set_updated_at()` trigger
function updates connection and sync-state timestamps.

### Current database indexes

- `lastfm_auth_requests_expires_at_idx` on expiry and
  `lastfm_auth_requests_user_expires_at_idx` on user and expiry.
- Scrobble primary key `(user_id, event_id)` and
  `scrobbles_user_played_at_idx` on `(user_id, played_at DESC, event_id)`.
- Scrobble filter/range indexes for `artist_mbid`, `album_id`, `track_mbid`,
  `track_id`, and the track/artist/album name fields, paired with user and
  `played_at DESC` (some are partial where the column is non-null).
- `scrobble_sync_state_status_idx` on status and update time.
- `track_metadata` composite primary key `(user_id, track_id)`.

These indexes support cloud chronological retrieval and several entity/date
filter patterns. They do not provide full-text substring search. Current
client-side analytics generally read IndexedDB rather than querying these
cloud indexes.

### RLS and database changes

The hardening migration enables RLS and revokes broad table access. Scrobble
authenticated-role operations are restricted to `auth.uid() = user_id`.
Connections, auth requests, and sync state are server-operated. The Edge
Function validates the bearer token with Supabase Auth before it uses
service-role credentials and scopes each REST query by that user ID.

`supabase/tests/database/rls.test.sql` exercises user isolation for scrobble
reads, inserts, updates, and deletes, and verifies that app roles cannot access
the server-only connection, authorization-request, and sync-state tables.

Treat a schema change as a coordinated server/client change: add a new
timestamped migration, update the Edge Function or repository code that reads
and writes the affected columns, and update `supabase/tests/database/rls.test.sql`
when access policy behavior changes. Never put credential values in SQL files
or README documentation.

## Last.fm Edge Function

The single function is `lastfm`, implemented in
`supabase/functions/lastfm/index.ts`. Its gateway JWT verification is disabled
in `supabase/config.toml` so the browser authorization redirect can reach the
function. JSON actions independently validate the Supabase bearer token against
`/auth/v1/user`.

Current JSON actions include authorization start/completion, disconnect,
account lookup, sync state, sync page, sync acknowledgement, cloud-history
page, now-playing, and track-duration lookup. The GET route handles the
short-lived Last.fm authorization redirect.

The function is responsible for Last.fm API signing/retries, session-key
encryption and decryption, track/scrobble normalization, bulk scrobble writes,
duration metadata reads/writes, cloud-history paging, and sync checkpoints.
Cloud REST requests are made with server-side service credentials; those
credentials are never returned to the client.

Configure secret values in Supabase Function secrets, not in Vite variables or
Android resources. Names used by the function:

- `LASTFM_API_KEY`
- `LASTFM_SHARED_SECRET`
- `LASTFM_SESSION_ENCRYPTION_KEY`
- `SUPABASE_URL` (provided by the Supabase function environment)
- `SUPABASE_ANON_KEY` (provided/configured for Auth validation)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only Supabase credential)

The AES-GCM key is validated as 64 hexadecimal characters by the function.
Only variable names belong in documentation; never copy secret values into
source control.

## Where do I change this?

| I want to change... | Start here | Also inspect |
|---|---|---|
| Home layout/sections | `src/screens/home/HomeScreen.tsx` | `src/screens/home/components/`, `src/screens/home/hooks/useHomeData.ts` |
| Home summary or ranking calculation | `src/features/analytics/services/listeningSummary.ts` | `analyticsCore.ts`, `useHomeData.ts` |
| Timeline presentation | `src/screens/timeline/TimelineScreen.tsx` | `monthlyAnalytics.ts`; preserve Timeline behavior |
| Timeline month metrics | `src/features/analytics/services/monthlyAnalytics.ts` | `TimelineScreen.tsx`, duration resolver |
| Profile display | `src/screens/profile/ProfileScreen.tsx` | `App.tsx`, `types/music.ts`, profile metadata sources |
| Activity calendar/heatmap | `src/screens/activity/ActivityScreen.tsx` | `calendarActivityAnalytics.ts`, `weeklyHeatmapAnalytics.ts`, `listeningSessionsAnalytics.ts` |
| Charts | `src/screens/charts/ChartsScreen.tsx` | `useChartsData.ts`, `musicRatioAnalytics.ts`, `fingerprintAnalytics.ts`, `listeningClockAnalytics.ts` |
| History list or filters | `src/screens/history/HistoryAndSearchScreen.tsx` | `useListeningHistory.ts`, `scrobbleRepository.ts` |
| Global music Search | `HistoryAndSearchScreen.tsx` | metadata maps in `analyticsCore.ts`; there is no server full-text search |
| Rediscover rules | `src/features/analytics/services/rediscoverAnalytics.ts` | `RediscoverScreen.tsx`, `listeningStoryAnalytics.ts` |
| Loved-track list | `src/screens/loved/LovedAndTrustScreen.tsx` | `App.tsx` localStorage handler, `entityAnalytics.ts` |
| Integrity analysis | `src/features/analytics/services/integrityAnalytics.ts` | `LovedAndTrustScreen.tsx` |
| Listening Story sequence/presentation | `src/features/listening-story/ListeningStoryModal.tsx` | `listeningStoryAnalytics.ts`; keep calculations in analytics services |
| Listening Story values | `src/features/analytics/services/listeningStoryAnalytics.ts` | services it composes, modal |
| Last.fm authorization UI | `src/features/lastfm/hooks/useLastFmAuthorization.ts` | `SettingsScreen.tsx`, `lastfmApi.ts`, Edge Function |
| Client-to-Supabase/Edge requests | `src/features/lastfm/api/lastfmApi.ts` | `.env.example`, function request validation |
| Sync orchestration/page persistence | `src/features/sync/services/syncService.ts` | `lastfmApi.ts`, `scrobbleRepository.ts`, Edge Function |
| Last.fm API signing, session, cloud sync | `supabase/functions/lastfm/index.ts` | all relevant SQL migrations and Edge Function secrets |
| Local scrobble persistence/query | `src/data/local/scrobbleRepository.ts` | IndexedDB migrations and History hook |
| Track-duration cache/enrichment | `src/features/analytics/services/trackDurationEnrichment.ts` | `useTrackDurationBackfill.ts`, `lastfmApi.ts`, Edge Function, duration migration |
| Live now-playing polling | `src/features/telemetry/hooks/useLivePlayback.ts` | `lastfmApi.ts`, `LiveTelemetryCard.tsx`, Home |
| Theme definitions | `src/features/themes/themeRegistry.ts` | `SettingsScreen.tsx`, `App.tsx`, navigation/header |
| Navigation or screen routing | `src/app/navigation/appTabs.ts` or `src/app/components/AppScreenRouter.tsx` | `App.tsx`, `PrimaryNavigation.tsx`, `MoreFeaturesMenu.tsx` |
| Shared entity details | `src/components/common/EntityDetailSheet.tsx` | `entityAnalytics.ts`, `App.tsx` |
| Shared mobile UI primitives | `src/components/ui/MobilePrimitives.tsx` | consuming screens |
| Shared application types | `src/types/music.ts` | all affected TypeScript consumers |
| Database schema/RLS | `supabase/migrations/` | Edge Function, repository behavior, RLS tests |
| Android package/native shell | `capacitor.config.ts`, `android/app/` | rerun `npm run android:sync` after web/native config changes |

### Important file responsibilities

In this table, **Used by / depends on** names key consumers and collaborators.
**Modify here when** identifies the file's scope; behavior owned by another
layer should be changed in that layer instead.

| File | Purpose / contains | Used by / depends on | Modify here when |
|---|---|---|---|
| `src/app/App.tsx` | Top-level app state, startup hydration, sync scheduling/actions, local preferences, modal and theme state | App shell and router | Coordinating application lifecycle or adding root-owned state; do not put analytics algorithms or API signing here |
| `src/app/components/AppScreenRouter.tsx` | Chooses which screen is mounted and passes its props | `App.tsx` | Adding/changing screen routing; do not implement screen calculations here |
| `src/app/components/AppHeader.tsx`, `PrimaryNavigation.tsx`, `MoreFeaturesMenu.tsx` | Header controls, primary tabs, and secondary feature menu | App shell | Shell/navigation presentation |
| `src/app/navigation/appTabs.ts` | Tab ID union types | Router/navigation | Adding a tab ID; update all navigation surfaces too |
| `src/screens/home/HomeScreen.tsx` | Home section composition | Router | Home layout; not persistence, API, or core analytics |
| `src/screens/home/hooks/useHomeData.ts` | Home period/tab state and memoized calls to shared summary/rankings | Home screen | Home-specific selection/memoization; shared calculation belongs in analytics services |
| `src/screens/home/components/*.tsx` | Home banner, overview, quick links, recent preview, rankings UI | Home screen | Individual Home presentation |
| `src/screens/activity/ActivityScreen.tsx` | Calendar, weekly heatmap, and insight UI | Router; activity analytics services | Activity presentation; calculation rules belong in analytics services |
| `src/screens/charts/ChartsScreen.tsx` | Advanced chart and visualization UI | Router; `useChartsData.ts` | Chart presentation; report calculations belong in analytics services |
| `src/screens/timeline/TimelineScreen.tsx` | Year/month timeline presentation and expansion state | Router; `monthlyAnalytics.ts` | Timeline UI only; avoid changing its data semantics casually |
| `src/screens/profile/ProfileScreen.tsx` | Profile header, lifetime metrics, and curated sections | Router; summary analytics; entity sheet | Profile presentation; profile data loading belongs in its actual provider/source |
| `src/screens/history/HistoryAndSearchScreen.tsx` | History/Search UI, entity search results, paged row rendering | Router | History/Search presentation |
| `src/screens/history/hooks/useListeningHistory.ts` | Query lifecycle, cancellation, 30-row page state, cursor pagination | History screen | Page size, cursor loading, query state; storage mechanics belong in repository |
| `src/screens/charts/hooks/useChartsData.ts` | Charts filters/selection and memoized analytics reports | Charts screen | Chart-specific inputs and memoization |
| `src/screens/rediscover/RediscoverScreen.tsx` | Candidate filters and Rediscover list UI | Router; `rediscoverAnalytics.ts` | Candidate presentation and user controls; scoring belongs in analytics |
| `src/screens/loved/LovedAndTrustScreen.tsx` | Loved list and integrity report UI | Router; `entityAnalytics.ts`, `integrityAnalytics.ts` | Tab/filter presentation; analysis belongs in analytics |
| `src/screens/settings/SettingsScreen.tsx` | Auth controls, sync/settings presentation, theme selection, local data actions | Router; authorization hook; app callbacks | Settings UI; authorization protocol and sync orchestration belong elsewhere |
| `src/data/local/scrobbleRepository.ts` | IndexedDB schema, migration, normalization, reads/writes, metadata persistence | Sync, startup, History, duration enrichment | Local schema/query/persistence only; cloud REST belongs in Edge Function |
| `src/data/catalog/musicCatalog.ts` | Empty initial catalogs, default profile, initial sync state | App and analytics maps | Defaults/catalog data |
| `src/features/lastfm/api/lastfmApi.ts` | Anonymous Supabase Auth session, Edge Function client calls, typed request/response models | Authorization, sync, telemetry, enrichment | Client endpoint/action contract; never add server secrets |
| `src/features/lastfm/hooks/useLastFmAuthorization.ts` | Browser redirect and authorization/disconnect state | Settings | Authorization UI lifecycle; server token exchange belongs in Edge Function |
| `src/features/sync/services/syncService.ts` | Cloud restore, Last.fm page loop, local page writes, checkpoint progression, sync results | `App.tsx` | Sync orchestration; keep page writes before checkpoint advancement |
| `src/features/telemetry/hooks/useLivePlayback.ts` | Visible/Home-only now-playing polling and in-flight control | App shell | Poll lifecycle; do not merge playback state into completed scrobbles |
| `src/features/telemetry/components/LiveTelemetryCard.tsx` | Now-playing/recent-scrobble card presentation | Home screen | Telemetry card UI |
| `src/features/analytics/services/analyticsCore.ts` | Shared metadata registry, range filters, duration resolver, formatters | Analytics services and Search | Shared cross-feature analytics primitives |
| `src/features/analytics/services/*.ts` | Screen-independent analytics reports; individual modules and their consumers are listed above | Analytics barrels, screen hooks, detail sheet, and Story | Calculations shared between features; do not duplicate them in JSX |
| `src/features/analytics/services/trackDurationEnrichment.ts` | Unique missing-track selection, 10-item batches, local persistence and in-memory registration | App/backfill hook | Client enrichment and cache behavior |
| `src/features/analytics/hooks/useTrackDurationBackfill.ts` | Prevents overlapping backfills and schedules UI refreshes | App shell | Backfill lifecycle; API details belong in service/API client |
| `src/features/listening-story/ListeningStoryModal.tsx` | Story playback UI and card sequence | App shell | Story presentation/sequence; values belong in analytics service |
| `src/features/themes/themeRegistry.ts` | Accent and base theme definitions and lookup | App, Settings, screens | Theme tokens only |
| `supabase/functions/lastfm/index.ts` | Server authorization, Last.fm calls, encryption, normalization, Postgres REST, sync and duration actions | Supabase deployment | Server-side Last.fm/cloud behavior |
| `supabase/migrations/*.sql` | Versioned schema, constraints, indexes, triggers, grants, policies | Supabase CLI | Database changes; do not edit deployed schema ad hoc |

Other analytics modules are described in [Analytics architecture](#analytics-architecture).
Shared UI files are `src/components/common/EntityDetailSheet.tsx` (entity
detail composition) and `src/components/ui/MobilePrimitives.tsx` (shared
artwork, selectors, and modal primitives).

## Do not break these

- Never place Last.fm shared secrets, session encryption keys, or Supabase
  service-role credentials in client code, Vite `VITE_` variables, Capacitor
  configuration, or Android resources.
- Keep secret-dependent Last.fm requests behind the `lastfm` Edge Function.
- Keep `user_id` scoping and RLS policies aligned with the authenticated
  Supabase user. Do not casually grant client access to server-only tables.
- Do not advance sync checkpoints before the corresponding local page has
  persisted. Preserve page order, overlap, deduplication, and replay safety.
- Do not insert one cloud request per scrobble; keep the existing bulk page
  write and local transaction pattern.
- Do not request duration per play; deduplicate by track and use the bounded
  duration batches.
- Do not fabricate track duration, treat unknown duration as zero coverage, or
  use timestamp gaps as listening time.
- Keep UI composition separate from reusable analytics calculations.
- Do not introduce full-history reloads for a feature that can query a page or
  a narrower dataset. Note: current startup does load full history; avoid
  making that more frequent or expanding it to repeated screen transitions.
- Preserve Timeline semantics when changing shared analytics code.
- Do not manually edit generated `dist/` or Capacitor-copied web assets.
- Keep profiling output temporary and free of credentials or private listening
  metadata not needed for measurement.

## Environment configuration

### Public client configuration

Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-supabase-key
```

These are public client settings bundled into the web application. The API
client validates that the URL is HTTPS and rejects localhost for the Android
app. Rebuild and run `npm run android:sync` after changing build-time Vite
values so the native asset bundle is refreshed.

### Server secrets

Configure `LASTFM_API_KEY`, `LASTFM_SHARED_SECRET`, and
`LASTFM_SESSION_ENCRYPTION_KEY` in Supabase Function secrets. Supabase also
provides server-side `SUPABASE_URL` and service credentials to the function.
Never place those values in `.env.local`, `VITE_*`, or Android files. Secret
values are intentionally not documented here.

## Development and Android workflow

### Install and run the web application

From the repository root:

```powershell
npm install
npm run dev
```

The Vite development server listens on port 3000. The deployed `lastfm`
function and a configured Supabase project are still needed for real auth,
sync, telemetry, and enrichment.

### Validate and build web assets

```powershell
npm run lint
npm run build
```

`lint` runs `tsc --noEmit`; `build` runs `vite build` and writes generated
assets to `dist/`.

### Sync and build Android debug APK

`android:sync` builds the web app, then runs Capacitor sync:

```powershell
npm run android:sync
Set-Location .\android
.\gradlew.bat assembleDebug --no-daemon
Set-Location ..
```

The debug APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install and launch on a connected device or emulator:

```powershell
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
adb shell monkey -p com.scrobblex.app 1
```

The Android application ID is `com.scrobblex.app`. The native entry activity
is `MainActivity`, a minimal Capacitor `BridgeActivity`. App functionality and
screens are in the web source, not Java. To edit the native wrapper, manifest,
icons, or Gradle configuration, use `android/` and rerun the relevant build.
Release signing configuration is not defined by the current checked-in
`android/app/build.gradle`; configure signing through the project's release
process rather than assuming a signed release artifact is generated here.

### Supabase setup and database tests

For an already configured Supabase CLI project, migrations and function
deployment use:

```powershell
npx supabase db push
npx supabase functions deploy lastfm
```

The function depends on the database schema and server secrets described
above. The SQL policy test is run against a started local Supabase stack:

```powershell
npx supabase test db
```

There is no npm test script in the current `package.json`.

### Recommended change workflow

1. Find the owning screen/feature in the maintenance table.
2. Trace the screen's hook to its shared analytics service, repository, API
   client, or Edge Function before editing.
3. Keep UI, business logic, local persistence, and server-only behavior in
   their current layers.
4. If database shape or access changes, add a migration and update the Edge
   Function/client contract and RLS tests as applicable.
5. If a Last.fm server action or secret usage changes, update and deploy the
   `lastfm` Edge Function. Do not rely on a client-only build to publish it.
6. Run `npm run lint` and `npm run build`; then run `npm run android:sync` and
   build/install the APK when validating Android.
7. Verify sync resume/deduplication, data retention, duration coverage, and
   target-device behavior for changes affecting those paths.

## Generated files

Normally edit source/configuration, not build output:

| Path | Status | Guidance |
|---|---|---|
| `dist/` | Vite build output | Regenerate with `npm run build`; do not edit by hand |
| `android/app/src/main/assets/public/` | Capacitor-copied web build and runtime assets | Regenerate with `npm run android:sync` |
| `android/app/build/` | Gradle output, including APKs | Regenerate with Gradle; do not edit |
| `node_modules/` | Installed packages | Recreate with npm; do not hand-edit |
| `android/gradlew.bat`, wrapper files | Gradle wrapper/support | Use the wrapper; do not edit for app behavior |

The normal editable areas are `src/`, `supabase/migrations/`,
`supabase/functions/`, and configuration files when the relevant build or
deployment behavior changes.

## Known limitations and pending verification

- Startup loads the full local scrobble history into React state and performs
  full-array registration, sorting, and a full-store byte-size scan. Memory
  and some analytics work therefore still grow with lifetime history.
- Most aggregate calculations are client-side and array-based. Screen-local
  memoization does not provide a shared persistent cache.
- History pagination is cursor-based, but date/text filters are evaluated
  while walking cursor rows. Global entity Search uses loaded in-memory maps;
  neither is backed by full-text search.
- The History list fetches 30 items per page but does not use a virtualized
  list component in the current source.
- Anonymous Supabase identity is installation-scoped. Clearing app data or
  reinstalling does not provide a cross-device account recovery mechanism.
- Profile data beyond the connected username/display name is initialized with
  empty defaults in the current app flow.
- Track durations depend on Last.fm metadata availability. Tracks with no
  resolvable duration remain unknown; cached negative lookups are eligible for
  retry after 30 days.
- The automatic sync and now-playing loops are foreground/visibility-aware
  web timers, not native background jobs.
- Repository source does not establish whether a particular Supabase project
  has received the current migrations/function deployment, or whether a
  physical Android device has been tested. Verify deployment and device behavior
  in the target environment before release.
- Profiling instrumentation marked `[TEMP PERF]` remains in the client and
  Edge Function source. Treat it as temporary and avoid logging secrets.
