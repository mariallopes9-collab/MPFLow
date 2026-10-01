import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import type { Role } from './types';

export interface Profile {
  nome: string; cargo: Role; telefone: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  face: number[] | null; foto: string | null;
}
type Me = Profile & { email: string };

interface AuthValue {
  session: { email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<string | null>;
  signInFace: (descriptor: number[]) => Promise<string | null>;
  signUp: (nome: string, cargo: Role, email: string, senha: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (p: Profile) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try { setMe(await api<Me>('/me')); } catch { setToken(null); setMe(null); }
  };

  useEffect(() => {
    (getToken() ? refreshProfile() : Promise.resolve()).finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, senha: string) => {
    try {
      const r = await api<{ token: string; user: Me }>('/auth/login', { method: 'POST', body: { email, senha } });
      setToken(r.token);
      setMe({ ...r.user, email });
      return null;
    } catch (e) { return (e as Error).message; }
  };
  const signInFace = async (descriptor: number[]) => {
    try {
      const r = await api<{ token: string; user: Me }>('/auth/face-login', { method: 'POST', body: { descriptor } });
      setToken(r.token);
      setMe(r.user);
      return null;
    } catch (e) { return (e as Error).message; }
  };
  const signUp = async (nome: string, cargo: Role, email: string, senha: string) => {
    try { await api('/auth/register', { method: 'POST', body: { nome, cargo, email, senha } }); return null; }
    catch (e) { return (e as Error).message; }
  };
  const signOut = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* sessão já expirada */ }
    setToken(null); setMe(null);
  };
  const updateProfile = async (p: Profile) => {
    try { const r = await api<Me>('/me', { method: 'PUT', body: { nome: p.nome, telefone: p.telefone, face: p.face, foto: p.foto } }); setMe({ ...r, email: me?.email ?? '' }); return null; }
    catch (e) { return (e as Error).message; }
  };

  return (
    <Ctx.Provider value={{ session: me ? { email: me.email } : null, profile: me, loading, signIn, signInFace, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
