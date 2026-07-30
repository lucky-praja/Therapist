import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Therapist } from '@/types';

interface AuthState {
  session: Session | null;
  therapist: Therapist | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshTherapist: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'therapist'}-${suffix}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadTherapist(userId: string) {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load therapist profile:', error.message);
      setTherapist(null);
      return;
    }
    setTherapist(data as Therapist | null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadTherapist(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession) {
          await loadTherapist(newSession.user.id);
        } else {
          setTherapist(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed — no user returned.' };

    const slug = slugify(fullName);
    const { error: profileError } = await supabase.from('therapists').insert({
      id: data.user.id,
      email,
      full_name: fullName,
      slug,
    });
    if (profileError) return { error: profileError.message };

    await loadTherapist(data.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) await loadTherapist(data.user.id);
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setTherapist(null);
    setSession(null);
  }

  async function refreshTherapist() {
    if (session) await loadTherapist(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{ session, therapist, loading, signUp, signIn, signOut, refreshTherapist }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
