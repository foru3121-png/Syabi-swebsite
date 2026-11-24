SYABI'S.COM — UPDATED WEBSITE PACKAGE

Included 5 files:
1. index.html — updated website frontend
2. firebase.json — Firebase Hosting configuration
3. firestore.rules — Firestore security rules
4. storage.rules — Storage locked down (this version does not use Firebase Storage)
5. README.txt — setup notes

IMPORTANT LIMITATIONS
- This package fixes the frontend registration lookup by using publicReferrals and publicMembers, without opening private users collection reads.
- The first registration is allowed only while publicReferrals is empty. Every later registration needs a valid referral code.
- Admin login uses Firebase Authentication Gmail + password AND admins/{AUTH_UID} document with enabled=true.
- This version does NOT implement trusted server-side wallet credits, referral cash rewards, or withdrawal settlement. Do not use it to accept or promise real earnings until a trusted backend is installed and tested.
- Firebase Storage is not used. Storage rules deny all access; no Blaze upgrade is needed for this version's image editor because images are saved in Firestore documents.
- Do not delete the GitHub Actions workflow or your GitHub secret. Replace only the five root files listed above.
- Never share Firebase service-account JSON, private keys, or passwords.

FIRESTORE COLLECTIONS
- admins/{ADMIN_AUTH_UID}: manually create; fields: enabled (boolean true). Document ID must exactly equal the admin Firebase Authentication UID.
- users/{AUTH_UID}: created by registration. Private profile.
- publicReferrals/{REFERRAL_CODE}: created by registration; fields uid and code only.
- publicMembers/{AUTH_UID}: created by registration; fields uid, name, referralCode, referredBy only.
- paymentRequests/{AUTO_ID}: created by signed-in users as pending.
- withdrawalRequests/{AUTO_ID}: created by signed-in users as pending.
- siteImages/{PAGE_ID}: admin-managed page images.

Existing users registered before this package may need one-time publicReferrals and publicMembers documents created manually to make referral/team lookup work. Do not delete existing users or admins.
