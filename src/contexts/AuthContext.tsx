import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { auth, db, googleProvider } from '../config/firebase';
import { UserRole, UserDetails } from '../types';

interface User {
  uid: string;
  email: string;
  role?: UserRole;
  name?: string;
  phoneNumber?: string;
  location?: {
    address: string;
    area: string;
  };
}

interface AuthContextType {
  currentUser: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  setUserDetails: (details: UserDetails) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFirebaseError = (error: any) => {
    console.error('Firebase operation error:', error);
    
    // Handle browser extension blocking
    if (error.code === 'failed-precondition' || 
        error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.message?.includes('permission-denied')) {
      setError(`
        Unable to connect to Firebase. This might be due to:
        1. Ad blockers or privacy extensions blocking the connection
        2. Network connectivity issues
        
        Please try:
        1. Temporarily disable ad blockers for this site
        2. Allow firestore.googleapis.com in your privacy settings
        3. Check your internet connection
        4. Refresh the page and try again
      `);
      return;
    }

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'unavailable':
          setError('Service temporarily unavailable. Please check your internet connection and try again.');
          break;
        case 'resource-exhausted':
          setError('Too many attempts. Please wait a few minutes and try again.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  // Function to ensure user document exists in Firestore
  const ensureUserDocument = async (user: FirebaseUser) => {
    if (!user.email) {
      throw new Error('User email is required');
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document without role
        const userData = {
          email: user.email,
          createdAt: new Date()
        };
        
        await setDoc(userRef, userData);
        
        return {
          uid: user.uid,
          email: user.email
        };
      }
      
      const data = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        role: data.role as UserRole,
        name: data.name,
        phoneNumber: data.phoneNumber,
        location: data.location as { address: string; area: string } | undefined
      };
    } catch (error) {
      handleFirebaseError(error);
      // Return basic user data if Firestore operation fails
      return {
        uid: user.uid,
        email: user.email
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Wait a bit for Firebase Auth to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          const userData = await ensureUserDocument(user);
          setCurrentUser(userData);
          setError(null); // Clear any previous errors
        } else {
          setCurrentUser(null);
          setError(null);
        }
      } catch (error) {
        handleFirebaseError(error);
        if (user) {
          // Set basic user data even if Firestore operation fails
          setCurrentUser({
            uid: user.uid,
            email: user.email!
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      // Wait a bit for Firebase Auth to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      const userData = await ensureUserDocument(result.user);
      setCurrentUser(userData);
    } catch (error) {
      handleFirebaseError(error);
      throw error;
    }
  };

  const setUserRole = async (role: UserRole) => {
    if (!currentUser) throw new Error('No user logged in');
    if (!auth.currentUser) {
      // Wait for auth state to be fully initialized
      await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, user => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
      });
    }

    try {
      setError(null);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // First verify we can read the document
      const docSnap = await getDoc(userRef);
      
      const userData = {
        email: currentUser.email,
        role: role,
        updatedAt: new Date()
      };

      if (!docSnap.exists()) {
        // Document doesn't exist, create it
        await setDoc(userRef, userData);
      } else {
        // Document exists, update it
        await updateDoc(userRef, userData);
      }
      
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    } catch (error: any) {
      console.error('Error in setUserRole:', error);
      
      if (error.code === 'permission-denied') {
        setError('Access denied. Please try signing out and in again.');
      } else if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setError(
          'It seems your browser is blocking Firebase. Please disable any ad blockers or privacy extensions for this site, then refresh the page.'
        );
      } else {
        setError('Unable to update role. Please try again.');
      }
      throw error;
    }
  };

  const setUserDetails = async (details: UserDetails) => {
    if (!currentUser) throw new Error('No user logged in');

    // Ensure we have a valid Firebase auth user
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setError('Authentication error. Please sign out and sign in again.');
      throw new Error('No Firebase auth user');
    }

    try {
      setError(null);
      const userRef = doc(db, 'users', firebaseUser.uid);
      
      // Create/Update user document
      const userData = {
        email: firebaseUser.email,
        ...details,
        updatedAt: new Date()
      };

      // Use set with merge option to handle both create and update
      await setDoc(userRef, userData, { merge: true });
      
      // Update local state
      setCurrentUser(prev => prev ? { ...prev, ...details } : null);
    } catch (error: any) {
      console.error('Error in setUserDetails:', error);
      
      if (error.code === 'permission-denied') {
        setError('Access denied. Please try signing out and in again.');
      } else if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setError(
          'It seems your browser is blocking Firebase. Please disable any ad blockers or privacy extensions for this site, then refresh the page.'
        );
      } else {
        setError('Unable to update user details. Please try again.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      handleFirebaseError(error);
      throw error;
    }
  };

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    setUserRole,
    setUserDetails,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
