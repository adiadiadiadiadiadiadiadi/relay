import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

const API_URL = 'http://localhost:3002';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  signup: (email: string, password: string, name?: string, walletAddress?: string, walletLabel?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user data from backend using Firebase ID token
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${API_URL}/api/auth/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, name?: string, walletAddress?: string, walletLabel?: string) {
    try {
      // 1. Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // 2. Create user in backend database with Firebase UID
      const response = await fetch(`${API_URL}/api/auth/firebase-signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name || email,
          wallet_address: walletAddress, 
          wallet_label: walletLabel 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // If backend signup fails, we should clean up Firebase account
        // For now, just throw the error
        throw new Error(data.error || 'Failed to create user in database');
      }

      // User data will be set via the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User data will be set via the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserData(null);
  }

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
