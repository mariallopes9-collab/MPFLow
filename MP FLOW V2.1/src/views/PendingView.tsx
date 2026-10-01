import { useState } from 'react';
import { ScanFace, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../AuthContext';
import FaceGate from '../components/FaceGate';
import { btnPrimary } from '../components/StageCommon';

export default function PendingView() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [gate, setGate] = useState(false);
  const recusado = profile?.status === 'recusado';
  return (
    <div className="bg-orbs min-h-screen flex items-center justify-center p-6 relative">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-md relative z-10 space-y-4 text-center">
        <h1 className="text-xl font-extrabold text-slate-800">Olá, {profile?.nome}</h1>
        {recusado ? <p className="text-sm text-rose-600">Seu acesso foi recusado pelo gerente.</p> : (
          <>
            <p className="text-sm text-slate-600">{profile?.face ? 'Rosto cadastrado. Aguardando a aprovação do gerente para liberar sua área.' : 'Para concluir o cadastro, registre seu rosto. Depois, o gerente aprova seu acesso.'}</p>
            {!profile?.face && <button onClick={() => setGate(true)} className={`${btnPrimary} w-full justify-center`}><ScanFace size={16} /> Cadastrar meu rosto</button>}
            <button onClick={refreshProfile} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-marinho-600 bg-marinho-400/15"><RefreshCw size={16} /> Verificar aprovação</button>
          </>
        )}
        <button onClick={signOut} className="text-sm text-slate-500 inline-flex items-center gap-1"><LogOut size={14} /> Sair</button>
      </div>
      <FaceGate open={gate} forceEnroll onClose={() => setGate(false)} onVerified={() => setGate(false)} />
    </div>
  );
}
