import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Fill these values with your Firebase Web App config from Firebase Console.
const firebaseConfig = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  databaseURL: "https://gaztakip-2e3a1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gaztakip-2e3a1",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_SENDER_ID",
  appId: "REPLACE_APP_ID"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const database = getDatabase(app);
