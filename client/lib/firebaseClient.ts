import { initializeApp } from "firebase/app";
// firebaseClient now reuses client/lib/firebase to avoid duplicate initializeApp
import { auth as firebaseAuth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export const auth = firebaseAuth;
export { RecaptchaVerifier, signInWithPhoneNumber };
