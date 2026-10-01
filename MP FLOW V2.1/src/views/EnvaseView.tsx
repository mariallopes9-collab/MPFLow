import { useEffect, useState } from 'react';
import { ScanFace, Flag } from 'lucide-react';
import { useOP } from '../OPContext';
import FaceGate from '../components/FaceGate';
import Modal from '../components/Modal';
import Barcode from '../components/Barcode';
import QRLote from '../components/QRLote';
import Checklist, { isChecklistComplete } from '../components/Checklist';
import { OPCard, Empty, inputCls, labelCls, btnPrimary, btnGhost } from '../components/StageCommon';
import { audit } from '../seed';
import type { ProducaoOP, Bomba, Misturador } from '../types';

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
const fmtDH = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const decorrido = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 6e4));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`;
};
const botaoGrande = `${btnPrimary} w-full justify-center py-4 text-base`;

export default function EnvaseView() {
  const { ops, currentUser, saveOP, notify } = useOP();
  const [after, setAfter] = useState<{ run: () => void } | null>(null);
  const [endId, setEndId] = useState<string | null>(null);
  const [qtd, setQtd] = useState('');
  const [peso, setPeso] = useState('');
  const [mix, setMix] = useState<Misturador>('Mix 1');
  const [bomba, setBomba] = useState<Bomba>('Bomba A');
  const [fim, setFim] = useState(nowLocal());
  const [parada, setParada] = useState('0');
  const [, setTick] = useState(0);

  // atualiza o "tempo decorrido" na tela sem o operador precisar fazer nada
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const lista = ops.filter((o) => o.status_atual === 'Envase');
  const endOP = ops.find((o) => o.id_op === endId);

  // O dia/hora/minuto é registrado no instante do toque, antes do Face ID.
  const abrirInicio = (op: ProducaoOP) => {
    const agora = nowLocal();
    setAfter({ run: () => iniciar(op, agora) });
  };

  const iniciar = (op: ProducaoOP, agora: string) =>
    saveOP({ ...op, quantidade_envase: op.quantidade_planejada, dados_producao: { ...op.dados_producao, baldes_produzidos: 0 }, timestamps: { ...op.timestamps, mistura_finalizada_em: agora, envase_iniciado_em: agora }, auditoria: audit(op, 'Envase', currentUser.name) }, `${op.id_op}: mistura/envase iniciado em ${fmtDH(agora)}`);

  const abrirFim = (op: ProducaoOP) => {
    const agora = nowLocal();
    setAfter({
      run: () => {
        setEndId(op.id_op); setFim(agora); setQtd(String(op.quantidade_envase ?? op.quantidade_planejada)); setPeso('');
        setMix(op.misturador_utilizado ?? 'Mix 1'); setBomba(op.dados_producao.bomba_utilizada ?? 'Bomba A'); setParada('0');
      },
    });
  };

  const finalizar = () => {
    if (!endOP?.timestamps.envase_iniciado_em) return;
    const total = Math.max(1, Math.round((new Date(fim).getTime() - new Date(endOP.timestamps.envase_iniciado_em).getTime()) / 6e4));
    const pesoNum = parseFloat(peso.replace(',', '.'));
    saveOP({
      ...endOP, status_atual: 'Laboratório', misturador_utilizado: mix,
      dados_producao: { ...endOP.dados_producao, bomba_utilizada: bomba, baldes_produzidos: +qtd, peso_total_kg: Number.isFinite(pesoNum) ? pesoNum : null, tempo_total_envase_min: total, tempo_parada_min: +parada || 0 },
      timestamps: { ...endOP.timestamps, envase_finalizado_em: fim }, auditoria: audit(endOP, 'Envase', currentUser.name),
    }, `${endOP.id_op}: envase finalizado em ${fmtDH(fim)}, enviada para o Laboratório`);
    setEndId(null);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <p className="text-sm text-slate-500">{lista.length} OP(s) prontas para mistura e envase. O Face ID é conferido antes de iniciar.</p>
      {lista.length === 0 && <Empty text="Nenhuma OP aguardando envase." />}
      {lista.map((op) => {
        const iniciada = !!op.timestamps.envase_iniciado_em;
        const alvo = op.quantidade_envase ?? op.quantidade_planejada;
        return (
          <OPCard key={op.id_op} op={op} actions={iniciada
            ? <button onClick={() => abrirFim(op)} className={botaoGrande}><ScanFace size={20} /> Finalizar envase</button>
            : <button onClick={() => abrirInicio(op)} className={botaoGrande}><ScanFace size={20} /> Iniciar envase</button>}>
            <div className="text-sm text-slate-600">
              <p>Produto: <b>{op.produto}</b></p>
              <p>Quantidade: <b>{alvo.toLocaleString('pt-BR')} un</b></p>
              {iniciada && <p className="text-xs text-slate-500 mt-1">Em andamento · início {fmtDH(op.timestamps.envase_iniciado_em!)} · {decorrido(op.timestamps.envase_iniciado_em!)}</p>}
            </div>
          </OPCard>
        );
      })}

      {ops.filter((o) => o.timestamps.envase_finalizado_em).length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Lotes já envasados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ops.filter((o) => o.timestamps.envase_finalizado_em).map((o) => (
              <div key={o.id_op} className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                <QRLote id={o.id_op} size={72} />
                <div className="min-w-0"><p className="text-xs text-slate-400 font-semibold">{o.id_op}</p><p className="text-sm font-semibold text-slate-700 truncate">{o.produto}</p><p className="text-xs text-slate-500">{o.status_atual}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FaceGate open={!!after} onDenied={() => notify('ACESSO NEGADO (Etapa 3: Envase): rosto não confere com a conta logada')} etapa="Etapa 3: Envase" onClose={() => setAfter(null)} onVerified={() => { after?.run(); setAfter(null); }} />

      <Modal open={!!endOP} onClose={() => setEndId(null)} title={`Finalizar envase ${endOP?.id_op ?? ''}`}>
        {endOP && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="glass-subtle rounded-xl p-3 text-sm text-slate-700">Fim registrado automaticamente: <b>{fmtDH(fim)}</b></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Quantidade envasada</label><input type="number" min={0} className={inputCls} value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
              <div><label className={labelCls}>Peso total (kg)</label><input type="number" inputMode="decimal" min={0} step="any" className={inputCls} value={peso} onChange={(e) => setPeso(e.target.value)} /></div>
              <div><label className={labelCls}>Misturador</label><select className={inputCls} value={mix} onChange={(e) => setMix(e.target.value as Misturador)}><option>Mix 1</option><option>Mix 2</option></select></div>
              <div><label className={labelCls}>Bomba</label><select className={inputCls} value={bomba} onChange={(e) => setBomba(e.target.value as Bomba)}><option>Bomba A</option><option>Bomba B</option></select></div>
              <div className="sm:col-span-2"><label className={labelCls}>Tempo parado (min)</label><input type="number" min={0} className={inputCls} value={parada} onChange={(e) => setParada(e.target.value)} /></div>
            </div>
            <div><Barcode code={endOP.codigo_barras} /></div>
            <Checklist opId={endOP.id_op} etapa="Envase" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEndId(null)} className={btnGhost}>Cancelar</button>
              <button onClick={finalizar} disabled={!+qtd || !isChecklistComplete(endOP, 'Envase')} className={btnPrimary}><Flag size={16} /> Enviar para o Laboratório</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
