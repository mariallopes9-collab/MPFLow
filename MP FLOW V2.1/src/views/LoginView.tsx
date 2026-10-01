import { useState } from 'react';
import { LogIn, UserPlus, ScanFace } from 'lucide-react';
import { useAuth } from '../AuthContext';
import type { Role } from '../types';
import { BrandHeader, BrandFooter } from '../components/BrandBar';
import FaceLogin from '../components/FaceLogin';

const ROLES: Role[] = ['Qualidade', 'Verificação', 'Envase', 'Laboratório'];
const input = 'w-full glass-subtle rounded-xl px-4 py-3 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-turquesa-500/40';

export default function LoginView() {
  const { signIn, signUp } = useAuth();
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<Role>('Qualidade');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [faceOpen, setFaceOpen] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const err = modo === 'login' ? await signIn(email, senha) : await signUp(nome, cargo, email, senha);
    if (err) setMsg({ ok: false, t: err });
    else if (modo === 'cadastro') setMsg({ ok: true, t: 'Conta criada. Entre, cadastre seu rosto e aguarde a aprovação do gerente.' });
    setBusy(false);
  };

  return (
    <div className="bg-orbs min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md relative z-10"><BrandHeader /></div>
      <form onSubmit={enviar} className="glass-strong rounded-3xl p-5 sm:p-8 w-full max-w-md relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <img src="/image.png" alt="Multiperfil" className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Multiperfil Live</h1>
            <p className="text-xs text-slate-500">{modo === 'login' ? 'Entre para acessar a produção' : 'Crie sua conta de acesso'}</p>
          </div>
        </div>
        {modo === 'cadastro' && (
          <>
            <input className={input} placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <select className={input} value={cargo} onChange={(e) => setCargo(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </>
        )}
        <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={input} type="password" placeholder="Senha (mín. 6 caracteres)" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {msg && <p className={`text-sm ${msg.ok ? 'text-turquesa-700' : 'text-rose-600'}`}>{msg.t}</p>}
        <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-marinho-600 to-marinho-800 shadow-md disabled:opacity-50">
          {modo === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
          {modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        {modo === 'login' && (
          <button type="button" onClick={() => setFaceOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-700 glass-subtle">
            <ScanFace size={16} /> Entrar com ID facial
          </button>
        )}
        <button type="button" onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setMsg(null); }} className="w-full text-sm text-slate-500 hover:text-slate-800">
          {modo === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </form>
      <FaceLogin open={faceOpen} onClose={() => setFaceOpen(false)} />
      <div className="w-full max-w-md relative z-10"><BrandFooter /></div>
    </div>
  );
}
