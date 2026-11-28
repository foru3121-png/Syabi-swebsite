// Syabi's.com Push Notification Cloud Functions
// Add this module to the existing Firebase Functions project.
// Do NOT replace your existing functions/index.js. Add:
// Object.assign(exports, require("./notifications"));

const admin = require("firebase-admin");
const { onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Set SITE_URL in functions/.env to the exact HTTPS address of your website.
const SITE_URL = process.env.SITE_URL || "https://YOUR-WEBSITE-URL/";

function absoluteUrl(path) {
  try { return new URL(path || "/", SITE_URL).href; }
  catch (_) { return SITE_URL; }
}

async function sendToUser(uid, title, body, path) {
  if (!uid) return;
  const tokenSnap = await db.collection("users").doc(uid).collection("notificationTokens").get();
  const docs = tokenSnap.docs.filter(d => typeof d.data().token === "string" && d.data().token.length > 20);
  const tokens = docs.map(d => d.data().token);
  if (!tokens.length) return;

  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const chunkDocs = docs.slice(i, i + 500);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title: title || "Syabi's.com", body: body || "You have a new update." },
      data: { title: title || "Syabi's.com", body: body || "You have a new update.", url: path || "/" },
      webpush: {
        fcmOptions: { link: absoluteUrl(path || "/") },
        notification: { icon: absoluteUrl("/favicon.ico"), badge: absoluteUrl("/favicon.ico") }
      }
    });

    const removals = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error && result.error.code;
        if (code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token") {
          removals.push(chunkDocs[index].ref.delete().catch(() => null));
        }
      }
    });
    if (removals.length) await Promise.all(removals);
  }
}

async function sendToAllActive(title, body, path) {
  const users = await db.collection("users").where("status", "==", "active").get();
  await Promise.allSettled(users.docs.map(d => sendToUser(d.id, title, body, path)));
}

function timestampValue(v) {
  if (!v) return 0;
  if (typeof v.toMillis === "function") return v.toMillis();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

exports.notifyWithdrawalStatus = onDocumentUpdated("withdrawalRequests/{requestId}", async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  if (before.status === after.status || !["approved", "rejected"].includes(after.status)) return;
  const amount = Number(after.amount || after.deductedAmount || 0);
  if (after.status === "approved") {
    await sendToUser(after.uid, "Syabi's.com", `Your withdrawal request of Rs. ${amount} has been approved.`, "/wallet");
  } else {
    const reason = String(after.adminReason || after.rejectionReason || "").trim();
    await sendToUser(after.uid, "Syabi's.com", `Your withdrawal request of Rs. ${amount} was rejected.${reason ? " Reason: " + reason : ""}`, "/wallet");
  }
});

exports.notifyPaymentApproved = onDocumentUpdated("paymentRequests/{requestId}", async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  if (before.status === after.status || after.status !== "approved") return;
  await sendToUser(after.uid, "Syabi's.com", "Your payment has been verified and your account has been approved.", "/payment");
});

exports.notifyUserWarning = onDocumentUpdated("users/{uid}", async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  const newText = String(after.warningText || "").trim();
  if (!newText) return;
  if (timestampValue(before.warningSentAt) === timestampValue(after.warningSentAt) &&
      String(before.warningText || "") === String(after.warningText || "")) return;
  await sendToUser(event.params.uid, "Syabi's.com — Warning", newText, "/profile");
});

exports.notifyAnnouncement = onDocumentWritten("publicSettings/general", async event => {
  const before = event.data.before.exists ? (event.data.before.data() || {}) : {};
  const after = event.data.after.exists ? (event.data.after.data() || {}) : {};
  const title = String(after.announcementTitle || "Announcement").trim() || "Announcement";
  const announcement = String(after.announcement || "").trim();
  const announcementChanged = announcement !== String(before.announcement || "") ||
    title !== (String(before.announcementTitle || "Announcement").trim() || "Announcement");
  if (announcementChanged && announcement) {
    await sendToAllActive("Syabi's.com — " + title, announcement.slice(0, 500), "/home");
    return;
  }
  if (event.data.before.exists && event.data.after.exists) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changed = [...keys].some(k => !["updatedAt", "updatedBy"].includes(k) &&
      JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
    if (changed) await sendToAllActive("Syabi's.com", "Website information has been updated. Open the website to see the latest changes.", "/home");
  }
});

exports.notifyTeamMissionChange = onDocumentWritten("teamMissions/{missionId}", async event => {
  const before = event.data.before.exists ? (event.data.before.data() || {}) : null;
  const after = event.data.after.exists ? (event.data.after.data() || {}) : null;
  if (before && after && ["name", "target", "reward", "active"].every(k =>
      JSON.stringify(before[k] ?? null) === JSON.stringify(after[k] ?? null))) return;

  if (!before && after) {
    if (after.active === false) return;
    await sendToAllActive("Syabi's.com — New Team Mission", `${after.name || "A new mission"} has been added. Target: ${after.target || "—"} members. Reward: Rs. ${after.reward || 0}.`, "/team");
  } else if (before && !after) {
    await sendToAllActive("Syabi's.com — Mission Update", `${before.name || "A team mission"} has been removed.`, "/team");
  } else if (after) {
    await sendToAllActive("Syabi's.com — Mission Update", `${after.name || "A team mission"} has been updated.`, "/team");
  }
});

exports.notifyAdminSettingsChange = onDocumentWritten("adminSettings/{settingId}", async event => {
  const before = event.data.before.exists ? (event.data.before.data() || {}) : null;
  const after = event.data.after.exists ? (event.data.after.data() || {}) : null;
  if (before && after) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changed = [...keys].some(k => !["updatedAt", "updatedBy"].includes(k) &&
      JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
    if (!changed) return;
  }
  await sendToAllActive("Syabi's.com — Website Update", "Website settings have been changed. Open Syabi's.com to see the latest updates.", "/home");
});

exports.notifyWebsiteImageChange = onDocumentWritten("siteImages/{imageId}", async event => {
  await sendToAllActive("Syabi's.com — Website Update", "Website appearance has been updated.", "/home");
});
