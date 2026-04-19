import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextType';

// Hardcoded owners as per requirements
const OWNER_EMAILS = ['vijayadhithya.j@gmail.com', 'g3082492@gmail.com'];
const SECRET_INVITE_CODE = '15042011';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPendingInvites = useCallback(async (targetUser?: User) => {
    const u = targetUser || user;
    if (!u?.email) return;

    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', u.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      // 1. Auto-grant owner for hardcoded emails
      if (OWNER_EMAILS.includes(u.email)) {
        const { data: newProfile, error } = await supabase
          .from('users')
          .insert([{
            id: u.id,
            email: u.email,
            name: u.user_metadata?.full_name || u.email.split('@')[0],
            role: 'owner'
          }])
          .select()
          .single();
        
        if (!error && newProfile) {
          setProfile(newProfile);
          return;
        }
      }

      // 2. Check for pre-approved invites (from staff/leader settings)
      const { data: invite, error: inviteError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('email', u.email)
        .single();

      if (invite && !inviteError) {
        const { data: newProfile, error: profileError } = await supabase
          .from('users')
          .insert([{
            id: u.id,
            email: u.email,
            name: invite.name,
            role: invite.role // staff or team_leader
          }])
          .select()
          .single();

        if (!profileError && newProfile) {
          await supabase.from('pending_invites').delete().eq('email', u.email);
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Error checking invites:', err);
    }
  }, [user]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) return { success: false, message: error.message };
    if (data.user) await checkPendingInvites(data.user);
    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) return { success: false, message: error.message };
    if (data.user) await checkPendingInvites(data.user);
    return { success: true };
  };

  const submitInviteCode = async (code: string) => {
    if (!user) return { success: false, message: 'Not authenticated.' };
    
    if (code === SECRET_INVITE_CODE) {
      // Grant VIEWER status for the secret code (not owner anymore)
      const { data: newProfile, error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: 'viewer' // Changed from 'owner' based on new requirement
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Profile creation error:', error);
        return { success: false, message: `DB Error: ${error.message}` };
      }

      if (newProfile) {
        setProfile(newProfile);
        return { success: true };
      }
      return { success: false, message: 'Profile created but not returned.' };
    }
    
    return { success: false, message: 'Invalid secret verification code.' };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (!initialSession) {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (!currentSession) {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        await checkPendingInvites();
      }
      setIsLoading(false);
    };

    if (user) {
      fetchProfile();
    }
  }, [user, checkPendingInvites]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      isLoading, 
      signOut,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      checkPendingInvites,
      submitInviteCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}
