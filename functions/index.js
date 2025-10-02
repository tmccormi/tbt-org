const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const { emails: defaultModerators = [] } = require("./moderators.json");

function parseList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getAllowedModerators() {
  const envModerators = parseList(
    process.env.ALLOWED_MODERATORS || process.env.COMMENTS_ALLOWED_MODERATORS
  );

  if (envModerators.length > 0) {
    return envModerators.map((email) => email.toLowerCase());
  }

  return defaultModerators.map((email) => email.toLowerCase());
}

function getRecaptchaSecret() {
  const configSecret = functions.config().recaptcha?.secret;
  return process.env.RECAPTCHA_SECRET_KEY || configSecret;
}

async function verifyRecaptcha(token, remoteIp) {
  const secret = getRecaptchaSecret();
  if (!secret) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "reCAPTCHA secret key is not configured."
    );
  }

  if (!token) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Missing reCAPTCHA token."
    );
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (remoteIp) {
    params.append("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    throw new functions.https.HttpsError(
      "internal",
      "Unable to verify reCAPTCHA token at this time."
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new functions.https.HttpsError("permission-denied", "reCAPTCHA validation failed.");
  }

  return result;
}

exports.submitComment = functions.https.onCall(async (data, context) => {
  const { name, email, message, postId, recaptchaToken } = data || {};
  const remoteIp = context.rawRequest?.ip;

  await verifyRecaptcha(recaptchaToken, remoteIp);

  if (!name || !email || !message || !postId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Name, email, message, and postId are required."
    );
  }

  const sanitizedComment = {
    name: String(name).trim().slice(0, 150),
    email: String(email).trim().toLowerCase(),
    message: String(message).trim().slice(0, 5000),
    postId: String(postId),
    approved: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection("comments").add(sanitizedComment);

  return { status: "pending" };
});

exports.moderateComment = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token || !context.auth.token.email) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const allowedModerators = getAllowedModerators();
  const moderatorEmail = String(context.auth.token.email).toLowerCase();

  if (!allowedModerators.includes(moderatorEmail)) {
    throw new functions.https.HttpsError("permission-denied", "You are not allowed to moderate comments.");
  }

  const { commentId, approved, recaptchaToken } = data || {};
  const remoteIp = context.rawRequest?.ip;

  await verifyRecaptcha(recaptchaToken, remoteIp);

  if (!commentId || typeof approved !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A commentId and approved flag are required."
    );
  }

  const commentRef = admin.firestore().collection("comments").doc(String(commentId));
  const snapshot = await commentRef.get();

  if (!snapshot.exists) {
    throw new functions.https.HttpsError("not-found", "Comment not found.");
  }

  await commentRef.update({
    approved,
    moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
    moderatedBy: moderatorEmail,
  });

  return { status: approved ? "approved" : "rejected" };
});
