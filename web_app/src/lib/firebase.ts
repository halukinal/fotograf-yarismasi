
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debugging: Check if API Key is loaded
if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing! Please check .env.local");
    console.log("Environment Variables Loaded:", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "***" : "MISSING",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Explicitly connect to the 'foto' database
const db = getFirestore(app, 'foto');
const storage = getStorage(app);

export { app, auth, db, storage };
