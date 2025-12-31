import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signUp, signOut, getSession, getCurrentUser, type User, type Session } from '@/integrations/mongodb/auth';
import { mongodb } from '@/integrations/mongodb/client';

type AppRole = 'admin' | 'patient' | 'doctor';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      // Check user_roles collection
      const userRole = await mongodb.findOne<{ role: string }>('user_roles', { user_id: userId });
      
      if (userRole) {
        setRole(userRole.role as AppRole);
      } else {
        // Check if user is a doctor
        const doctor = await mongodb.findOne('doctors', { user_id: userId });
        if (doctor) {
          setRole('doctor');
        } else {
          // Default to patient
          setRole('patient');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('patient');
    }
  };

  useEffect(() => {
    // Check for existing session
    const currentSession = getSession();
    if (currentSession) {
      setSession(currentSession);
      setUser(currentSession.user);
      fetchUserRole(currentSession.user.id);
    }
    setLoading(false);

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medicare_auth_token' || e.key === 'medicare_user') {
        const newSession = getSession();
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          fetchUserRole(newSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.error) {
      const newSession = getSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchUserRole(newSession.user.id);
      }
    }
    return result;
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    const result = await signUp(email, password, fullName);
    if (!result.error) {
      const newSession = getSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setRole(newSession.user.role || 'patient');
      }
    }
    return result;
  };

  const handleSignOut = async () => {
    signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin: role === 'admin',
        isDoctor: role === 'doctor',
        isPatient: role === 'patient',
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
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
