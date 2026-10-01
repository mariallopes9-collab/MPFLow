import { useState } from 'react';
import { ScanFace } from 'lucide-react';
import Modal from './Modal';
import FaceGate from './FaceGate';
import { useAuth } from '../AuthContext';

const input = 'w-full glass-subtle rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-marinho-400/40';

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, session, updateProfile } = useAuth();
  const [nome, setNome] = useState(profile?.nome ?? '');
  const [tel, setTel] = useState(profile?.telefone ?? '');
  const [msg, setMsg] = useState('');
  const [face, setFace] = useState(false);

  const salvar = async () => {
    if (!profile) return;
    const err = await updateProfile({ ...profile, nome: nome.trim(), telefone: tel });
    if (err) setMsg(err); else onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">{session?.email} · Cargo: <b>{profile?.cargo}</b> (definido pelo gerente)</p>
        <input className={input} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={input} placeholder="Telefone" value={tel} onChange={(e) => setTel(e.target.value)} />
        <button onClick={() => setFace(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-marinho-600"><ScanFace size={16} /> {profile?.face ? 'Recadastrar meu rosto' : 'Cadastrar meu rosto'}</button>
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-500">Cancelar</button>
          <button onClick={salvar} disabled={!nome.trim()} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-marinho-600 to-marinho-800 disabled:opacity-40">Salvar perfil</button>
        </div>
      </div>
      <FaceGate open={face} forceEnroll onClose={() => setFace(false)} onVerified={() => setFace(false)} />
    </Modal>
  );
}
