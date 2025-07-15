import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
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

// Initialize Firestore without persistence first
export const db = getFirestore(app);

// Function to initialize persistence
export const initializePersistence = async () => {
  try {
    // Try to enable persistence
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled successfully');
  } catch (err: any) {
    console.error('Error enabling persistence:', err);

    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('The current browser does not support offline persistence.');
    } else if (err.message?.includes('IndexedDB')) {
      // IndexedDB corruption, try to recover
      console.warn('IndexedDB corruption detected, attempting recovery...');
      
      try {
        // Disable network to clear pending operations
        await disableNetwork(db);
        // Re-enable network
        await enableNetwork(db);
        console.log('Recovery attempt completed');
      } catch (recoveryErr) {
        console.error('Recovery failed:', recoveryErr);
      }
    }
  }
};

export const functions = getFunctions(app);

export default app; 