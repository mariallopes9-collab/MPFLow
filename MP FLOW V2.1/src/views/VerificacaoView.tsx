import { useState } from 'react';
import { ScanFace, CheckCircle2 } from 'lucide-react';
import { useOP } from '../OPContext';
import FaceGate from '../components/FaceGate';
import Modal from '../components/Modal';
import Checklist, { isChecklistComplete } from '../components/Checklist';
import { OPCard, Empty, inputCls, labelCls, btnPrimary, btnGhost } from '../components/StageCommon';
import { audit } from '../seed';
import type { ProducaoOP } from '../types';

export default function VerificacaoView() {
  const { ops, currentUser, saveOP, notify } = useOP();
  const [after, setAfter] = useState<{ run: () => void } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [f, setF] = useState({ ph: '', di: '', df: '', placas: '' });

  const lista = ops.filter((o) => o.status_atual === 'Verificação');
  const sel = ops.find((o) => o.id_op === selId);
  const preenchido = Object.values(f).every((v) => v !== '');
  const pode = preenchido && isChecklistComplete(sel, 'Verificação');

  const abrir = (op: ProducaoOP) =>
    setAfter({ run: () => { setSelId(op.id_op); setF({ ph: op.dados_qualidade.ph?.toString() ?? '', di: op.dados_qualidade.densidade_inicial?.toString() ?? '', df: op.dados_qualidade.densidade_final?.toString() ?? '', placas: op.dados_qualidade.placas?.toString() ?? '' }); } });

  const aprovar = () => {
    if (!sel) return;
    saveOP({ ...sel, status_atual: 'Envase', dados_qualidade: { ...sel.dados_qualidade, ph: +f.ph, densidade_inicial: +f.di, densidade_final: +f.df, placas: +f.placas }, auditoria: audit(sel, 'Verificação', currentUser.name) }, `${sel.id_op}: verificação aprovada (pH ${f.ph}), enviada para Envase`);
    setSelId(null);
  };

  const campo = (k: keyof typeof f, label: string, ph: string) => (
    <div><label className={labelCls}>{label}</label><input type="number" step="0.01" className={inputCls} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <p className="text-sm text-slate-500">{lista.length} OP(s) recebida(s) do Gestor de Qualidade. O Face ID é conferido antes de iniciar.</p>
      {lista.length === 0 && <Empty text="Nenhuma lista de materiais aguardando verificação." />}
      {lista.map((op) => (
        <OPCard key={op.id_op} op={op} actions={<button onClick={() => abrir(op)} className={btnPrimary}><ScanFace size={16} /> Iniciar verificação</button>}>
          <p className="text-xs text-slate-500">Enviado por {op.auditoria.Qualidade?.usuario ?? '—'} · {op.materiais.length} materiais</p>
        </OPCard>
      ))}

      <FaceGate open={!!after} onDenied={() => notify('ACESSO NEGADO (Etapa 2: Verificação): rosto não confere com a conta logada')} etapa="Etapa 2: Verificação" onClose={() => setAfter(null)} onVerified={() => { after?.run(); setAfter(null); }} />

      <Modal open={!!sel} onClose={() => setSelId(null)} title={`Verificação ${sel?.id_op ?? ''}`} maxWidth="max-w-2xl">
        {sel && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-sm font-bold text-slate-700">{sel.produto} · {sel.quantidade_planejada.toLocaleString('pt-BR')} un</p>
              <ul className="mt-2 text-sm text-slate-600 space-y-0.5">
                {sel.materiais.map((m, i) => <li key={i}>{m.nome}: {m.quantidade} {m.disponivel ? '' : '(pendência)'}</li>)}
              </ul>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {campo('ph', 'pH', '8.0')}{campo('di', 'Densidade inicial', '1.30')}{campo('df', 'Densidade final', '1.35')}{campo('placas', 'Placas', '10')}
            </div>
            <Checklist opId={sel.id_op} etapa="Verificação" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelId(null)} className={btnGhost}>Cancelar</button>
              <button onClick={aprovar} disabled={!pode} className={btnPrimary}><CheckCircle2 size={16} /> Aprovar e enviar para Envase</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
