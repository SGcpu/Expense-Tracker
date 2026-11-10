# Sentinel's Journal

## 2026-11-10 - Missing Firestore Security Rules on New Collections Exposes Cross-Device Configs
**Vulnerability:** When cross-device sync for custom Supabase credentials was implemented in `DatabaseContext.tsx`, writes and reads were pointed to a new Firestore collection (`user_database_configs/{userId}`). However, `firestore.rules` was not updated to declare access rules for `user_database_configs`, causing operations to fall through to the catch-all `deny-all` rule or risk open access if relaxed.
**Learning:** In a Firestore backend with default-deny rules, any newly introduced client collection will immediately fail in production unless rules are synchronized in the same change. Furthermore, sensitive user config containing API keys must be strictly locked down to `request.auth.uid == userId` with size validation.
**Prevention:** Every PR introducing a new Firestore collection or document schema must update `firestore.rules` alongside client code, strictly enforcing `isOwner(userId)` and string size limits on configuration properties.
