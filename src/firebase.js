// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const rawConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

export const isFirebaseConfigured = requiredKeys.every((key) => hasValue(rawConfig[key]));

let app = null;
let auth = null;
let googleProvider = null;
let githubProvider = null;
let analytics = null;

if (isFirebaseConfigured) {
  app = initializeApp(rawConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();

  const supportsAnalytics = typeof window !== "undefined" && hasValue(rawConfig.measurementId);
  if (supportsAnalytics) {
    analytics = getAnalytics(app);
  }
} else {
  if (import.meta.env.DEV) {
    const missing = requiredKeys.filter((key) => !hasValue(rawConfig[key]));
    console.warn(
      `[firebase] Firebase configuration is incomplete. Missing env variables: ${missing.join(", ")}`
    );
  }
}

export { app, auth, googleProvider, githubProvider, analytics };