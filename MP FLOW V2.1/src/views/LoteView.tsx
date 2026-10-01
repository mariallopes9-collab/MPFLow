import { useEffect, useState } from 'react';
import { Radio, Check } from 'lucide-react';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import Barcode from '../components/Barcode';
import { getBombaCapacity } from '../calculations';
import type { ProducaoOP, OPStatus } from '../types';

const ETAPAS: OPStatus[] = ['Pedido', 'Verificação', 'Envase', 'Laboratório', 'Concluído'];
const dur = (min: number) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`;
const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function LoteView({ id }: { id: string }) {
  const [op, setOp] = useState<ProducaoOP | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const d = await api<ProducaoOP>(`/ops/${encodeURIComponent(id)}`); if (alive) setOp(d); }
      catch { if (alive) setOp(null); }
    };
    load();
    const a = setInterval(load, 5000);
    const b = setInterval(() => setNow(Date.now()), 1000);
    return () => { alive = false; clearInterval(a); clearInterval(b); };
  }, [id]);

  if (op === undefined) return <p className="text-sm text-slate-500">Carregando lote...</p>;
  if (op === null) return <GlassCard strong className="p-6 text-sm text-slate-500">Lote {id} não encontrado.</GlassCard>;

  const step = op.status_atual === 'Reprovado' ? 3 : ETAPAS.indexOf(op.status_atual);
  const inicio = op.timestamps.envase_iniciado_em ? new Date(op.timestamps.envase_iniciado_em).getTime() : null;
  const fim = op.timestamps.envase_finalizado_em ? new Date(op.timestamps.envase_finalizado_em).getTime() : null;
  const elapsed = inicio ? Math.max(0, ((fim ?? now) - inicio) / 6e4) : 0;
  const alvo = op.quantidade_envase ?? op.quantidade_planejada;
  const feitos = op.dados_producao.baldes_produzidos ?? 0;
  const pct = step > 2 ? 100 : Math.min(100, Math.round((feitos / alvo) * 100));
  const bomba = op.dados_producao.bomba_utilizada;
  const ideal = bomba ? getBombaCapacity(bomba) : 0;
  const ritmo = elapsed > 0 ? feitos / elapsed : 0;
  const ratio = ideal ? ritmo / ideal : 0;
  const emAndamento = op.status_atual === 'Envase' && !!inicio;
  const eta = emAndamento && ritmo > 0 && feitos < alvo ? new Date(now + ((alvo - feitos) / ritmo) * 6e4) : null;
  const saude = ratio >= 0.9 ? { t: 'No ritmo esperado', c: 'text-turquesa-600 bg-turquesa-400/15' } : ratio >= 0.7 ? { t: 'Atenção: ritmo um pouco abaixo', c: 'text-amber-600 bg-amber-400/15' } : { t: 'Ritmo abaixo do esperado', c: 'text-rose-600 bg-rose-400/15' };

  const info = (l: string, v: string | number | null | undefined) => (
    <div><p className="text-[11px] text-slate-400 uppercase">{l}</p><p className="text-sm font-semibold text-slate-700">{v ?? '—'}</p></div>
  );

  return (
    <div className="animate-fade-in space-y-5 max-w-3xl">
      <GlassCard strong className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 font-semibold">{op.id_op}</p>
            <h3 className="text-xl font-bold text-slate-800">{op.produto}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{alvo.toLocaleString('pt-BR')} un · Misturador: {op.misturador_utilizado ?? '—'}</p>
          </div>
          <div className="text-right space-y-1">
            <StatusBadge status={op.status_atual} />
            <p className="text-[11px] text-turquesa-600 flex items-center gap-1 justify-end"><Radio size={12} className="animate-pulse" /> ao vivo · {hora(new Date(now))}</p>
          </div>
        </div>

        <div className="flex items-center mt-6">
          {ETAPAS.map((e, i) => (
            <div key={e} className="flex-1 flex flex-col items-center relative">
              {i > 0 && <div className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= step ? 'bg-turquesa-400' : 'bg-slate-300/70'}`} />}
              <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step || op.status_atual === 'Concluído' ? 'bg-turquesa-500 text-white' : i === step ? (op.status_atual === 'Reprovado' ? 'bg-rose-500 text-white' : 'bg-marinho-600 text-white animate-pulse') : 'bg-slate-300 text-white'}`}>
                {i < step || op.status_atual === 'Concluído' ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 text-center">{e}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard strong className="p-5">
        <div className="flex justify-between text-sm text-slate-600 mb-1.5">
          <span>{step < 2 ? 'Aguardando o envase' : step === 2 && !inicio ? 'Pronto para iniciar a mistura e o envase' : step === 2 ? 'Mistura e envase em andamento' : 'Envase concluído'}</span>
          <b>{pct}%</b>
        </div>
        <div className="h-4 rounded-full bg-slate-200/70 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-marinho-500 to-turquesa-500 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
        <p className="text-xs text-slate-500 mt-1.5">{feitos.toLocaleString('pt-BR')} de {alvo.toLocaleString('pt-BR')} unidades envasadas</p>

        {emAndamento && (
          <div className="mt-4 space-y-3">
            {feitos > 0 && <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${saude.c}`}>{saude.t}</span>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {info('Tempo decorrido', dur(elapsed))}
              {info('Ritmo atual', feitos > 0 ? `${ritmo.toFixed(1)} baldes/min` : '—')}
              {info('Velocidade ideal', ideal ? `${ideal} baldes/min` : '—')}
              {info('Previsão de término', eta ? hora(eta) : '—')}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard strong className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {info('Bomba', bomba)}{info('pH', op.dados_qualidade.ph)}{info('Dens. inicial', op.dados_qualidade.densidade_inicial)}{info('Dens. final', op.dados_qualidade.densidade_final)}
          {info('Placas', op.dados_qualidade.placas)}{info('Início do envase', inicio ? new Date(inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null)}
          {info('Verificado por', op.auditoria['Verificação']?.usuario)}{info('Envase por', op.auditoria['Envase']?.usuario)}
        </div>
        <div className="mt-4"><Barcode code={op.codigo_barras} /></div>
      </GlassCard>
    </div>
  );
}
