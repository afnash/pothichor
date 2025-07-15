import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyB_v3aFmv4guZWdcPhxMf4hWm4n-7KDCYY",
  authDomain: "pothichor77.firebaseapp.com",
  projectId: "pothichor77",
  storageBucket: "pothichor77.firebasestorage.app",
  messagingSenderId: "1044207983123",
  appId: "1:1044207983123:web:8f3b8041c32e364d2a3de6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app; 