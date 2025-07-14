import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyAxpo7awCYUu4d4TRseMfMb4Xjik5uh6Bg",
    authDomain: "pothichor7.firebaseapp.com",
    projectId: "pothichor7",
    storageBucket: "pothichor7.firebasestorage.app",
    messagingSenderId: "312693397744",
    appId: "1:312693397744:web:6191abcebe72ca17960a35",
    measurementId: "G-25EW3YQG3Z" };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
