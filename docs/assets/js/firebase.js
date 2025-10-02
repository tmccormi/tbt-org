const firebaseVersion = "10.12.2";

const appModule = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`;
const authModule = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`;
const firestoreModule = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`;
const functionsModule = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-functions.js`;

const [{ initializeApp }, authExports, firestoreExports, functionsExports] = await Promise.all([
  import(appModule),
  import(authModule),
  import(firestoreModule),
  import(functionsModule),
]);

const {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} = authExports;
const {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  connectFirestoreEmulator,
} = firestoreExports;
const { getFunctions, httpsCallable, connectFunctionsEmulator } = functionsExports;

const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
const functionsRegion = window.__FIREBASE_FUNCTIONS_REGION__ || "us-central1";
const emulatorConfig = window.__FIREBASE_EMULATORS__ || {};

if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.warn("Firebase configuration is missing. Please set the required environment variables.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, functionsRegion);

if (emulatorConfig.functions) {
  const [host, port] = emulatorConfig.functions.split(":");
  if (host && port) {
    connectFunctionsEmulator(functions, host, Number(port));
  }
}

if (emulatorConfig.firestore) {
  const [host, port] = emulatorConfig.firestore.split(":");
  if (host && port) {
    connectFirestoreEmulator(db, host, Number(port));
  }
}

export {
  app,
  auth,
  db,
  functions,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  httpsCallable,
};
