import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBnxmjVjKisKpejJl6opSZIKJcKIwCJXts",
  authDomain: "crispy-c9702.firebaseapp.com",
  databaseURL: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "crispy-c9702",
  storageBucket: "crispy-c9702.firebasestorage.app",
  messagingSenderId: "332328214728",
  appId: "1:332328214728:web:3d5b958a839c6ba92345fd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const functions = getFunctions(app);

if (typeof window !== "undefined") {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
}

// Zero-Trust Bot Protection: Firebase App Check
// Temporarily disabled for local testing to avoid 401/403 token errors
/*
if (typeof window !== "undefined") {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // Enable self-debug token for local dev environments
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    const siteKey = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RECAPTCHA_SITE_KEY) 
      || "6Lf-theblackbox-recaptcha-v3-placeholder";
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("[AppCheck] App Check provider initialization:", err?.message || err);
  }
}
*/
