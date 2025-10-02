function required(value, fallback = "") {
  return value || fallback;
}

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

const firebaseFunctionsRegion = required(process.env.FIREBASE_FUNCTIONS_REGION, "us-central1");

module.exports = {
  firebaseConfig: {
    apiKey: required(process.env.FIREBASE_API_KEY),
    authDomain: required(process.env.FIREBASE_AUTH_DOMAIN),
    projectId: required(process.env.FIREBASE_PROJECT_ID),
    storageBucket: required(process.env.FIREBASE_STORAGE_BUCKET),
    messagingSenderId: required(process.env.FIREBASE_MESSAGING_SENDER_ID),
    appId: required(process.env.FIREBASE_APP_ID),
  },
  firebaseFunctionsRegion,
  firebaseEmulators: {
    firestore: process.env.FIREBASE_EMULATOR_FIRESTORE || "",
    functions: process.env.FIREBASE_EMULATOR_FUNCTIONS || "",
  },
  recaptchaSiteKey: required(process.env.RECAPTCHA_SITE_KEY),
  allowedModerators: parseList(
    process.env.ALLOWED_MODERATORS || process.env.COMMENTS_ALLOWED_MODERATORS
  ),
};
