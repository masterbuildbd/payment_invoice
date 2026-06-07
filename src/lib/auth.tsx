import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { safeStringify } from './storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isSuccessTransition: boolean;
  successUsername: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    // Hydrate instantly from local storage cache if possible to skip loading flash entirely on refresh
    return !localStorage.getItem('master_user');
  });
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);
  const [successUsername, setSuccessUsername] = useState('');

  useEffect(() => {
    // Initial sync rehydration for mock users
    const savedUser = localStorage.getItem('master_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    const isPlaceholderFirebase = !firebaseConfig || !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed');
    if (isPlaceholderFirebase) {
      setIsLoading(false);
      return;
    }

    // Safety timeout in case Firebase authentication connection stalls or is offline (e.g. declined/bogus config)
    const safetyTimeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(safetyTimeoutId);
      if (firebaseUser) {
        // If we have a Firebase user, check if we have local metadata for them
        const saved = localStorage.getItem('master_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Sync UID if it's the mock admin role
          if (parsed.role === 'admin' && parsed.id !== firebaseUser.uid) {
            parsed.id = firebaseUser.uid;
            localStorage.setItem('master_user', safeStringify(parsed));
          }
          setUser(parsed);
        } else {
          // If no local metadata (e.g. Google Login), create a basic user object
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Master User',
            username: firebaseUser.email || firebaseUser.uid,
            role: 'user', // Default role
          };
          setUser(newUser);
          localStorage.setItem('master_user', safeStringify(newUser));
        }
      } else {
        // preserve 'admin' (mock) sessions
        const saved = localStorage.getItem('master_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.role === 'admin') {
              setUser(parsed);
            } else {
              setUser(null);
              localStorage.removeItem('master_user');
            }
          } catch (e) {
            setUser(null);
            localStorage.removeItem('master_user');
          }
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeoutId);
    };
  }, []);

  const login = React.useCallback(async (username: string, pass: string) => {
    const adminInput = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Custom registered users database login
    let userData: User | null = null;
    let dbError: any = null;

    const targetInput = username.trim();
    
    // Compute permutation of possible phone number matches to resolve prefix variations (e.g., +880, 880, 0, or raw)
    const altTargets = [targetInput];
    const cleanedPhone = targetInput.trim().replace(/[+\s-()]/g, '');
    if (/^\d+$/.test(cleanedPhone)) {
      if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
        const naked = cleanedPhone.substring(1);
        altTargets.push('+880' + naked);
        altTargets.push('880' + naked);
        altTargets.push(naked);
      } else if (cleanedPhone.length === 10) {
        altTargets.push('+880' + cleanedPhone);
        altTargets.push('880' + cleanedPhone);
        altTargets.push('0' + cleanedPhone);
        altTargets.push(cleanedPhone);
      } else if (cleanedPhone.startsWith('880') && cleanedPhone.length === 13) {
        const naked = cleanedPhone.substring(3);
        altTargets.push('+880' + naked);
        altTargets.push('0' + naked);
        altTargets.push(naked);
      }
      
      if (targetInput.startsWith('+')) {
        altTargets.push(targetInput.substring(1));
      } else {
        altTargets.push('+' + targetInput);
      }
    }
    const uniqueTargets = Array.from(new Set(altTargets.map(t => t.trim())));

    const isPlaceholderFirebase = !firebaseConfig || !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed');

    if (!isPlaceholderFirebase) {
      try {
        const usersRef = collection(db, 'users');
        // Fetch all potential credential query matches concurrently to minimize round trips and logins lag.
        // Wrap in a 1500ms timeout so that it falls back instantly on network lag.
        const fetchPromise = Promise.all([
          getDocs(query(usersRef, where('username', 'in', uniqueTargets))),
          getDocs(query(usersRef, where('phone', 'in', uniqueTargets))),
          getDocs(query(usersRef, where('email', '==', targetInput.toLowerCase())))
        ]);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase timeout')), 15000)
        );

        const [snapUsername, snapPhone, snapEmail] = await Promise.race([fetchPromise, timeoutPromise]);
        
        const activeSnapshot = [snapUsername, snapPhone, snapEmail].find(snap => !snap.empty);

        if (activeSnapshot) {
          const userDoc = activeSnapshot.docs[0];
          userData = { ...userDoc.data(), id: userDoc.id } as User;
        }
      } catch (err: any) {
        console.warn('Firestore lookup failed, falling back to local users cache:', err instanceof Error ? err.message : String(err));
        dbError = err;
      }
    } else {
      console.log('Bypassing Firestore lookup (placeholder Firebase config detected). Using local storage for instant login.');
    }

    // Try fallback lookup from localStorage
    if (!userData) {
      try {
        const localUsersStr = localStorage.getItem('local_users') || '[]';
        const localUsers = JSON.parse(localUsersStr);
        const matchedLocal = localUsers.find((u: any) => 
          (u.username && uniqueTargets.includes(u.username.trim())) || 
          (u.phone && uniqueTargets.includes(u.phone.trim())) || 
          (u.email && u.email.trim().toLowerCase() === targetInput.toLowerCase())
        );
        if (matchedLocal) {
          userData = { ...matchedLocal, id: matchedLocal.id || matchedLocal.phone || 'local-' + Date.now() };
        }
      } catch (e) {
        console.error('Failed to parse local users:', e);
      }
    }

    // Default admin fallback if not yet initialized in database/localStorage
    if (!userData) {
      if (adminInput === 'admin') {
        const storedAdminPass = localStorage.getItem('admin_password_override') || 'admin123';
        if (cleanPass === storedAdminPass) {
          userData = {
            id: 'admin',
            name: 'Master Admin',
            username: 'admin',
            role: 'admin',
            status: 'approved',
            password: storedAdminPass
          };
        }
      }
    }

    if (!userData) {
      throw dbError || new Error('invalid_credentials');
    }
    
    // Check password (with robust trimming to avoid leading/trailing space errors)
    const storedPass = (userData.password || '').trim();
    const enteredPass = pass.trim();
    if (storedPass !== enteredPass) {
      throw new Error('invalid_credentials');
    }
    
    // Check status approval
    if (userData.role !== 'admin') {
      const userStatus = userData.status || 'pending';
      if (userStatus === 'pending') {
        throw new Error('pending_approval');
      }
      if (userStatus === 'rejected') {
        throw new Error('rejected');
      }
    }
    
    setIsSuccessTransition(true);
    setSuccessUsername(userData.name || userData.username);
    await new Promise(resolve => setTimeout(resolve, 2200));
    setUser(userData);
    localStorage.setItem('master_user', safeStringify(userData));
    setIsSuccessTransition(false);
    return true;
  }, []);

  const loginWithGoogle = React.useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-in Failed:', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    localStorage.removeItem('master_user');
  }, []);

  const value = React.useMemo(() => ({
    user,
    login,
    loginWithGoogle,
    logout,
    isLoading,
    isSuccessTransition,
    successUsername
  }), [user, isLoading, login, loginWithGoogle, logout, isSuccessTransition, successUsername]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
