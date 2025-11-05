import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyAAB9dXWrymvyJSrE8Qg3Op4vXQMEtv2hw",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "aashish-properties.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aashish-properties",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "aashish-properties.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1074799820866",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1074799820866:web:60035a614911eb876faddb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WJS8TWNW00",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use device language and persist session locally
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch(() => {
  // ignore persistence errors in environments that don't support it
});

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGooglePopup() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

let _recaptcha: RecaptchaVerifier | null = null;
export function ensureRecaptcha(containerId = "recaptcha-container") {
  try {
    if (!_recaptcha) {
      // eslint-disable-next-line no-undef
      _recaptcha = new RecaptchaVerifier(
        containerId,
        { size: "invisible" },
        auth,
      );
    }
    return _recaptcha;
  } catch (err) {
    // In some environments RecaptchaVerifier may throw when window is not available
    console.warn("Recaptcha init failed:", err);
    return null;
  }
}

export async function sendOtp(phoneRaw: string) {
  const phone = formatPhone(phoneRaw);
  const verifier = ensureRecaptcha();
  if (!verifier) throw new Error("Recaptcha unavailable");
  return await signInWithPhoneNumber(auth, phone, verifier);
}

export function onAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export function formatPhone(input: string) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits; // default India
  if (input.startsWith("+")) return input;
  return "+" + digits;
}

export { signOut };
