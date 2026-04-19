import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string }>;
  checkPendingInvites: () => Promise<void>;
  submitInviteCode: (code: string) => Promise<{ success: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
