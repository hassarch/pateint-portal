// Custom authentication using MongoDB
import { mongodb } from './client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: 'admin' | 'patient' | 'doctor';
  created_at?: string;
}

export interface Session {
  user: User;
  token: string;
  expires_at: string;
}

const TOKEN_KEY = 'medicare_auth_token';
const USER_KEY = 'medicare_user';

// Simple JWT-like token (in production, use a proper JWT library)
function generateToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return btoa(JSON.stringify(payload));
}

function parseToken(token: string): { userId: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp && payload.exp > Date.now()) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
  try {
    // Find user in users collection
    const user = await mongodb.findOne<{
      _id: string;
      email: string;
      password: string; // In production, this should be hashed
      full_name?: string;
      role?: string;
    }>('users', { email });

    if (!user) {
      return { error: new Error('Invalid email or password') };
    }

    // In production, use bcrypt to compare passwords
    // For now, simple comparison (NOT SECURE - for development only)
    if (user.password !== password) {
      return { error: new Error('Invalid email or password') };
    }

    const token = generateToken(user._id);
    const sessionUser: User = {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: (user.role as 'admin' | 'patient' | 'doctor') || 'patient',
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Sign in failed') };
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ error: Error | null }> {
  try {
    // Check if user already exists
    const existingUser = await mongodb.findOne('users', { email });
    if (existingUser) {
      return { error: new Error('User with this email already exists') };
    }

    // In production, hash the password with bcrypt
    const userId = crypto.randomUUID();
    const userData = {
      _id: userId,
      email,
      password, // In production, hash this
      full_name: fullName,
      role: 'patient',
      created_at: new Date().toISOString(),
    };

    await mongodb.insertOne('users', userData);

    // Also create profile
    await mongodb.insertOne('profiles', {
      _id: userId,
      email,
      full_name: fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Auto sign in
    const token = generateToken(userId);
    const sessionUser: User = {
      id: userId,
      email,
      full_name: fullName,
      role: 'patient',
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Sign up failed') };
  }
}

export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (!token || !userStr) {
    return null;
  }

  const payload = parseToken(token);
  if (!payload) {
    signOut();
    return null;
  }

  const user = JSON.parse(userStr) as User;
  return {
    user,
    token,
    expires_at: new Date(payload.exp).toISOString(),
  };
}

export function getCurrentUser(): User | null {
  const session = getSession();
  return session?.user || null;
}



