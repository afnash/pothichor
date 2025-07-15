import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { UserRole, Location, UserDetails } from '../types';

interface User {
  uid: string;
  email: string;
  role?: UserRole;
  name?: string;
  phoneNumber?: string;
  location?: Location;
}

interface AuthContextType {
  currentUser: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  setUserDetails: (details: UserDetails) => Promise<void>;
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

  // Function to ensure user document exists in Firestore
  const ensureUserDocument = async (user: FirebaseUser) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document without role
      await setDoc(userRef, {
        email: user.email,
        createdAt: new Date()
      });
      
      return {
        uid: user.uid,
        email: user.email!
      };
    }
    
    const data = userDoc.data();
    return {
      uid: user.uid,
      email: user.email!,
      role: data.role as UserRole,
      name: data.name,
      phoneNumber: data.phoneNumber,
      location: data.location as Location | undefined
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          const userData = await ensureUserDocument(user);
          setCurrentUser(userData);
        } catch (error) {
          console.error('Error ensuring user document:', error);
          // Set basic user data even if Firestore operation fails
          setCurrentUser({
            uid: user.uid,
            email: user.email!
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userData = await ensureUserDocument(result.user);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const setUserRole = async (role: UserRole) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        email: currentUser.email,
        role: role,
        updatedAt: new Date()
      }, { merge: true });

      setCurrentUser(prev => prev ? { ...prev, role } : null);
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  };

  const setUserDetails = async (details: UserDetails) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        ...details,
        updatedAt: new Date()
      }, { merge: true });

      setCurrentUser(prev => prev ? { ...prev, ...details } : null);
    } catch (error) {
      console.error('Error setting user details:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    setUserRole,
    setUserDetails
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
