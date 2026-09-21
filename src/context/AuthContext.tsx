import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: UserRole, nip?: string, mapel?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  quickLoginAsRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy emails for 1-click role demo simulation if needed
const ROLE_ACCOUNTS: Record<UserRole, { email: string; pass: string; name: string; nip: string; mapel?: string }> = {
  admin: {
    email: 'admin.man2gorontalo@kemenag.go.id',
    pass: 'AdminMAN2#2026',
    name: 'H. Ruslan Abdullah, S.Pd., M.Si (Admin)',
    nip: '198204122008011015'
  },
  kamad: {
    email: 'kepala.man2gorontalo@kemenag.go.id',
    pass: 'KamadMAN2#2026',
    name: 'Dr. Hj. Yasintha Polapa, M.Pd. (Kepala Madrasah)',
    nip: '197305141999032001'
  },
  penilai: {
    email: 'penilai.senior@man2gorontalo.sch.id',
    pass: 'PenilaiMAN2#2026',
    name: 'Drs. Ibrahim Mohamad, M.Pd (Guru Senior/Penilai)',
    nip: '197008191997031002',
    mapel: 'Fisika / Koordinator Supervisi'
  },
  guru: {
    email: 'guru.biologi@man2gorontalo.sch.id',
    pass: 'GuruMAN2#2026',
    name: 'Siti Rahmawati Panigoro, S.Pd (Guru Sasaran)',
    nip: '198907232014032004',
    mapel: 'Biologi Fase F / Kelas XI'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string, fallbackUser?: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        return data;
      } else if (fallbackUser) {
        // Auto create default profile if not present
        const newProf: UserProfile = {
          uid,
          email: fallbackUser.email || '',
          displayName: fallbackUser.displayName || 'Pengguna Si-SuGu',
          role: 'guru',
          createdAt: new Date().toISOString(),
          isActive: true
        };
        await setDoc(userRef, newProf);
        return newProf;
      }
      return null;
    } catch (err) {
      console.warn('Gagal memuat profil pengguna dari Firestore:', err);
      // Fallback in-memory profile if Firestore permissions or offline
      if (fallbackUser) {
        return {
          uid,
          email: fallbackUser.email || '',
          displayName: fallbackUser.displayName || 'Pengguna',
          role: 'guru',
          createdAt: new Date().toISOString()
        };
      }
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const p = await fetchUserProfile(currentUser.uid, currentUser);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchUserProfile(user.uid, user);
      setProfile(p);
    }
  };

  const signIn = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const p = await fetchUserProfile(cred.user.uid, cred.user);
    setProfile(p);
  };

  const signUp = async (
    email: string, 
    pass: string, 
    name: string, 
    role: UserRole, 
    nip?: string, 
    mapel?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      role,
      nip: nip || '',
      mataPelajaran: mapel || '',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (e) {
      console.error('Error saving user profile to Firestore:', e);
    }
    setProfile(newProfile);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setProfile(null);
  };

  const resetPassword = async (emailToReset: string) => {
    await sendPasswordResetEmail(auth, emailToReset);
  };

  // Quick switch / demo registration for the 4 required roles
  const quickLoginAsRole = async (targetRole: UserRole) => {
    setLoading(true);
    const acc = ROLE_ACCOUNTS[targetRole];
    try {
      await signIn(acc.email, acc.pass);
    } catch {
      // If user doesn't exist yet in Firebase, auto register
      try {
        await signUp(acc.email, acc.pass, acc.name, targetRole, acc.nip, acc.mapel);
      } catch (signupErr) {
        console.error('Gagal daftar akun otomatis:', signupErr);
        throw signupErr;
      }
    } finally {
      setLoading(false);
    }
  };

  const role = profile?.role || null;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      resetPassword,
      quickLoginAsRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
