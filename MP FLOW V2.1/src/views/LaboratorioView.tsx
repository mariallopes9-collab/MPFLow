import { useState } from 'react';
import { ScanFace, CheckCircle2, XCircle } from 'lucide-react';
import { useOP } from '../OPContext';
import FaceGate from '../components/FaceGate';
import Modal from '../components/Modal';
import Barcode from '../components/Barcode';
import QRLote from '../components/QRLote';
import Checklist, { isChecklistComplete } from '../components/Checklist';
import { OPCard, Empty, inputCls, labelCls, btnPrimary, btnGhost, fmt } from '../components/StageCommon';
import { nowISO } from '../data';
import { audit } from '../seed';
import type { ProducaoOP } from '../types';

export default function LaboratorioView() {
  const { ops, currentUser, saveOP, notify } = useOP();
  const [after, setAfter] = useState<{ run: () => void } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState('');
  const [obs, setObs] = useState('');
  const [reprovando, setReprovando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const lista = ops.filter((o) => o.status_atual === 'Laboratório');
  const sel = ops.find((o) => o.id_op === selId);

  const abrir = (op: ProducaoOP) => setAfter({ run: () => { setSelId(op.id_op); setLote(''); setValidade(''); setObs(''); setReprovando(false); setMotivo(''); } });

  const decidir = (aprovar: boolean) => {
    if (!sel) return;
    const base = { ...sel, laboratorio: { lote, validade, obs }, auditoria: audit(sel, 'Laboratório', currentUser.name) };
    if (aprovar) saveOP({ ...base, status_atual: 'Concluído', dados_qualidade: { ...sel.dados_qualidade, aprovado_por: currentUser.name }, timestamps: { ...sel.timestamps, lab_aprovado_em: nowISO() } }, `${sel.id_op}: aprovada no laboratório (lote ${lote})`);
    else saveOP({ ...base, status_atual: 'Reprovado', dados_qualidade: { ...sel.dados_qualidade, reprovado_por: currentUser.name, justificativa_reprovacao: motivo }, timestamps: { ...sel.timestamps, lab_reprovado_em: nowISO() } }, `${sel.id_op}: REPROVADA no laboratório. Motivo: ${motivo}`);
    setSelId(null);
  };

  const dado = (l: string, v: string | number | null | undefined) => <div><p className="text-[11px] text-slate-400 uppercase">{l}</p><p className="text-sm font-semibold text-slate-700">{v ?? '—'}</p></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <p className="text-sm text-slate-500">{lista.length} OP(s) aguardando conferência final. O Face ID é conferido antes de iniciar.</p>
      {lista.length === 0 && <Empty text="Nenhuma OP aguardando o laboratório." />}
      {lista.map((op) => (
        <OPCard key={op.id_op} op={op} actions={<button onClick={() => abrir(op)} className={btnPrimary}><ScanFace size={16} /> Iniciar conferência</button>}>
          <p className="text-xs text-slate-500">Envase finalizado em {fmt(op.timestamps.envase_finalizado_em)}</p>
        </OPCard>
      ))}

      <FaceGate open={!!after} onDenied={() => notify('ACESSO NEGADO (Etapa 4: Laboratório): rosto não confere com a conta logada')} etapa="Etapa 4: Laboratório" onClose={() => setAfter(null)} onVerified={() => { after?.run(); setAfter(null); }} />

      <Modal open={!!sel} onClose={() => setSelId(null)} title={`Conferência ${sel?.id_op ?? ''}`} maxWidth="max-w-2xl">
        {sel && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="glass-subtle rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dado('Produto', sel.produto)}{dado('Quantidade', sel.quantidade_envase)}{dado('Misturador', sel.misturador_utilizado)}{dado('Bomba', sel.dados_producao.bomba_utilizada)}
              {dado('pH', sel.dados_qualidade.ph)}{dado('Dens. inicial', sel.dados_qualidade.densidade_inicial)}{dado('Dens. final', sel.dados_qualidade.densidade_final)}{dado('Placas', sel.dados_qualidade.placas)}
              {dado('Envasados', sel.dados_producao.baldes_produzidos)}{dado('Tempo total (min)', sel.dados_producao.tempo_total_envase_min)}{dado('Parada (min)', sel.dados_producao.tempo_parada_min)}{dado('Peso total (kg)', sel.dados_producao.peso_total_kg)}
              <div><Barcode code={sel.codigo_barras} /></div><div><QRLote id={sel.id_op} size={72} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Lote</label><input className={inputCls} value={lote} onChange={(e) => setLote(e.target.value)} /></div>
              <div><label className={labelCls}>Validade</label><input type="date" className={inputCls} value={validade} onChange={(e) => setValidade(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Observações</label><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
            </div>
            <Checklist opId={sel.id_op} etapa="Laboratório" />
            {reprovando && <div><label className={labelCls}>Motivo da reprovação</label><input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>}
            <div className="flex justify-end gap-3 flex-wrap">
              <button onClick={() => setSelId(null)} className={btnGhost}>Cancelar</button>
              {reprovando
                ? <button onClick={() => decidir(false)} disabled={!motivo.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 disabled:opacity-40"><XCircle size={16} /> Confirmar reprovação</button>
                : <button onClick={() => setReprovando(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-400/15">Reprovar</button>}
              <button onClick={() => decidir(true)} disabled={!lote.trim() || !validade || !isChecklistComplete(sel, 'Laboratório')} className={btnPrimary}><CheckCircle2 size={16} /> OK: aprovar lote</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
