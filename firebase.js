
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAk1m-0Onqd1ygXNeeaLyXmICjNyJEb0Rs",
    authDomain: "conference-pass-2026.firebaseapp.com",
    projectId: "conference-pass-2026",
    storageBucket: "conference-pass-2026.firebasestorage.app",
    messagingSenderId: "25984938643",
    appId: "1:25984938643:web:9268cd3512fe3946ae1366"
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {});

const auth = getAuth(app);

export { app, db, auth };
