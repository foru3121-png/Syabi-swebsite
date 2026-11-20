SYABI'S.COM — STARTER PROJECT (Stage 1)

Files:
- index.html: first-page UI and Firebase email/password sign-in wiring
- firestore.rules: restrictive starter security rules
- storage.rules: receipt/profile/site image rules (Storage requires billing-enabled setup)
- functions/index.js: trusted server functions for profile/referral creation, payment review and blocking
- firebase.json: Firebase Hosting / rules / Functions configuration

IMPORTANT:
1. Do not accept real payments or publish this as a live earning platform yet.
2. The browser UI is a starter. Registration intentionally does not complete until the callable backend is deployed and wired to it.
3. Cloud Functions and Cloud Storage may require the Firebase Blaze billing plan. Check current Firebase pricing and set budget alerts before upgrading.
4. Admin access must be granted securely using Firebase Admin SDK custom claims by a trusted operator. Never put an admin password in HTML or Firestore.
5. The payment approval function awards Rs.100 to a referrer only once per pending payment request. Before production, add transaction ledger IDs, duplicate/idempotency tests, withdrawal reservation/settlement functions, rate limits, email verification, App Check, and legal/compliance review.
6. Firebase web apiKey is a public client identifier, not an admin secret. Never expose service-account JSON or admin credentials.
