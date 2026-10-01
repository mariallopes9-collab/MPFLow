import { useEffect, useState } from 'react';
import { Check, X, UserCheck, ScanFace } from 'lucide-react';
import { api } from '../api';
import { useOP } from '../OPContext';
import GlassCard from '../components/GlassCard';
import { inputCls } from '../components/StageCommon';
import type { Role } from '../types';

interface Row { face_foto: string | null; id: string; nome: string; cargo: Role; status: string; face_descriptor: unknown }
const CARGOS: Role[] = ['Qualidade', 'Verificação', 'Envase', 'Laboratório', 'Gerente'];

export default function EquipeView() {
  const { notify } = useOP();
  const [rows, setRows] = useState<Row[]>([]);
  const load = async () => {
    setRows(await api<Row[]>('/profiles'));
  };
  useEffect(() => { load(); }, []);

  const set = async (r: Row, status: string) => {
    try { await api(`/profiles/${r.id}`, { method: 'PUT', body: { status, cargo: r.cargo } }); } catch (e) { window.alert((e as Error).message); }
    notify(`${r.nome}: acesso ${status === 'aprovado' ? `aprovado como ${r.cargo}` : status}`);
    load();
  };
  const setCargo = (id: string, cargo: Role) => setRows(rows.map((r) => (r.id === id ? { ...r, cargo } : r)));

  const bloco = (titulo: string, lista: Row[], vazio: string) => (
    <GlassCard strong className="p-5">
      <h3 className="text-base font-bold text-slate-800 mb-3">{titulo} ({lista.length})</h3>
      {lista.length === 0 && <p className="text-sm text-slate-400">{vazio}</p>}
      <div className="space-y-2">
        {lista.map((r) => (
          <div key={r.id} className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
            {r.face_foto ? <img src={r.face_foto} alt={r.nome} className="w-14 h-11 rounded-lg object-cover" /> : <div className="w-14 h-11 rounded-lg bg-slate-200/70" />}
            <div className="flex-1 min-w-[140px]">
              <p className="text-sm font-semibold text-slate-700">{r.nome}</p>
              <p className={`text-xs flex items-center gap-1 ${r.face_descriptor ? 'text-turquesa-600' : 'text-amber-600'}`}><ScanFace size={12} />{r.face_descriptor ? 'Rosto cadastrado' : 'Rosto pendente'}</p>
            </div>
            <select className={`${inputCls} max-w-[150px]`} value={r.cargo} onChange={(e) => setCargo(r.id, e.target.value as Role)}>{CARGOS.map((c) => <option key={c}>{c}</option>)}</select>
            {r.status !== 'aprovado' && <button disabled={!r.face_descriptor} onClick={() => set(r, 'aprovado')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-turquesa-500 disabled:opacity-40"><Check size={14} /> Aprovar</button>}
            {r.status === 'aprovado' && <button onClick={() => set(r, 'aprovado')} className="px-3 py-2 rounded-lg text-xs font-semibold text-marinho-600 bg-marinho-400/15">Salvar cargo</button>}
            {r.status !== 'recusado' && <button onClick={() => set(r, 'recusado')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-400/15"><X size={14} /> {r.status === 'aprovado' ? 'Revogar' : 'Recusar'}</button>}
          </div>
        ))}
      </div>
    </GlassCard>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <p className="text-sm text-slate-500 flex items-center gap-2"><UserCheck size={16} /> Aprove o acesso depois que a pessoa criar a conta e cadastrar o rosto, e defina o cargo dela.</p>
      {bloco('Aguardando aprovação', rows.filter((r) => r.status === 'pendente'), 'Nenhuma solicitação pendente.')}
      {bloco('Equipe aprovada', rows.filter((r) => r.status === 'aprovado'), 'Ninguém aprovado ainda.')}
      {bloco('Recusados', rows.filter((r) => r.status === 'recusado'), 'Nenhum.')}
    </div>
  );
}
