# Changelog

All notable changes to ExpenseTracker are documented here. Every change **must** bump the version
in `package.json` and add an entry at the top of this file (see [CLAUDE.md](../CLAUDE.md)).
The format follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).
The text of the matching section is used verbatim as the GitHub release notes.

Older history (pre-3.0) lives in [VERSION_HISTORY_LEGACY.md](./VERSION_HISTORY_LEGACY.md).

## [3.1.1] - 2026-11-10

### Security
- Added explicit Firestore security rules for `user_database_configs/{userId}` to protect synchronized Supabase credentials, ensuring access is strictly restricted to the authenticated document owner with string length validation.

## [3.1.0] - 2026-11-10

### Added
- **One-Click Supabase Deployment & Setup**: Local and non-technical users can launch and initialize their personal database in 1 click without needing database expertise.
- **Cross-Device Automatic Database Sync**: Configured Supabase credentials automatically synchronize to the user's Google account, so signing in from any device instantly reconnects to the user's database.
- **Unified Database Architecture**: Seamless switching between Supabase and Firebase across Transactions, Analytics, Notes, and Activity logs.
- Pre-built SQL schema (`docs/supabase_schema.sql`) with full table structures, indexes, and row-level security policies.

## [3.0.5] - 2026-11-05

### Fixed
- Android release build failed with "Value is null" while evaluating `build.gradle`; the app version is now read correctly, so the APK builds.

## [3.0.4] - 2026-11-05

### Changed
- The bottom navigation bar is now nearly opaque (96%) in both themes, so page content no longer shows through it.

## [3.0.3] - 2026-11-05

### Fixed
- Vercel/CI builds and the running app failed with "Component auth has not been registered yet". Two copies of `@firebase/app` were installed (now pinned to one via `overrides`), and Firebase is now only initialised in the browser, never during server prerender.

### Changed
- Required Node.js version raised to 26 (`engines` in `package.json`, CI and release workflows).

## [3.0.2] - 2026-11-05

### Fixed
- Vercel and CI builds failed with "Component auth has not been registered yet" because the Firebase 12 SDK requires Node 24.

### Changed
- Upgraded the required Node.js version to 24 (`engines` in `package.json`, CI and release workflows).

## [3.0.1] - 2026-11-05

### Fixed
- Release workflow failed while setting up the Android SDK; it now uses the SDK preinstalled on the build runner.

## [3.0.0] - 2026-11-05

### Highlights
- 📱 **Android app**: the app is now packaged as an APK (Capacitor) and published automatically to GitHub Releases.
- 🌗 **Light & dark themes** with a system-default option, a header toggle and an Appearance setting.
- 🔒 **Security hardening** across the data layer, dependencies, headers and the Android build.

### Security
- Added `firestore.rules`: every document is private to its owner, with server-side validation of types, amounts and lengths. Activity logs are append-only. **Deploy these rules** (`firebase deploy --only firestore:rules`).
- Upgraded Next.js to 16.4.5 (fixes a critical RCE advisory and several others), Firebase to 12.19, and forced `@grpc/grpc-js` to a patched version. `npm audit` is down from 14 findings (1 critical, 7 high) to 8 moderate, all in dev-only lint tooling with no upstream fix.
- Client writes are now whitelisted and validated (`src/lib/validation.ts`); `userId` can no longer be changed through an update call.
- Removed `getSystemActivityLogs`, which could read every user's activity.
- Activity logs no longer store email, name, user agent or IP placeholder.
- Data export no longer includes email or photo URL. Import is limited to 5 MB / 5000 rows and each row is validated.
- Added security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP) and disabled `X-Powered-By`.
- Android: backups and cleartext traffic disabled.
- Removed the leftover Firebase Hosting placeholder pages from `public/`.

### Added
- Theme system (`light` / `dark` / `system`) with no flash on load and OS-change tracking.
- Capacitor Android project, native Google sign-in on Android, `npm run build:static`, `npm run android:*` scripts.
- GitHub Actions: `ci.yml` (typecheck, lint, build) and `release.yml` (builds the APK and publishes a release with notes from this file).
- `CLAUDE.md`, `docs/CHANGELOG.md`, `docs/ANDROID.md`.

### Changed
- Refreshed UI: calmer palette, theme-aware frosted surfaces, softer shadows instead of neon glows, safe-area support, reduced-motion support.
- Dropdown menu closes when tapping outside it.
- Replaced `Source Sans Pro` with `Source Sans 3` (the old Google Fonts family name is deprecated).
- ESLint moved to the flat config required by Next 16 (`npm run lint` works again).

### Fixed
- `npm run lint` was broken (`next lint` was removed in Next 16).
- Dashboard loaded every transaction twice; stats are now computed from a single query.
- Quick-action buttons did full page reloads (`window.location.href`); they now use client-side navigation.
- Deleting all data issued unbounded parallel deletes; it now uses chunked batches.
- Missing `createdAt` on a document could crash the transaction list.
- Sign-in no longer shows an error toast when the user simply closes the Google popup.
