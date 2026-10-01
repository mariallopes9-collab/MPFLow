import { useOP } from '../OPContext';
import { calculatePerdaBaldes, formatNumber } from '../calculations';
import GlassCard from '../components/GlassCard';
import { Sparkles, Flame, Wallet, ArrowRight } from 'lucide-react';
import type { ProducaoOP, Misturador } from '../types';

// Premissas editáveis (declare-as na apresentação)
const CUSTO_BALDE = 8; // R$ por balde perdido
const CUSTO_MIN_PARADA = 14; // R$ por minuto de linha parada
const CUSTO_UNIDADE_REPROVADA = 6; // R$ por unidade de lote reprovado
const LIMITE_ESPERA_H = 2;

const STAGES = [
  { id: 'Verificação', label: 'Qualidade e Verificação', match: ['Pedido', 'Verificação'] },
  { id: 'Envase', label: 'Mistura e Envase', match: ['Envase'] },
  { id: 'Laboratório', label: 'Laboratório', match: ['Laboratório'] },
];

function sinceOf(op: ProducaoOP): string | null {
  const t = op.timestamps;
  if (op.status_atual === 'Laboratório') return t.envase_finalizado_em ?? t.criado_em;
  if (op.status_atual === 'Envase') return t.envase_iniciado_em ?? t.criado_em;
  return t.criado_em;
}

function hoursSince(iso: string | null): number {
  return iso ? Math.max(0, (Date.now() - new Date(iso).getTime()) / 36e5) : 0;
}

// Receita Viva: risco de reprovação por misturador, aprendido do histórico
function riskByMixer(ops: ProducaoOP[]): Record<Misturador, { rate: number; n: number }> {
  const out = {} as Record<Misturador, { rate: number; n: number }>;
  (['Mix 1', 'Mix 2'] as Misturador[]).forEach((m) => {
    const done = ops.filter(
      (o) => o.misturador_utilizado === m && (o.status_atual === 'Concluído' || o.status_atual === 'Reprovado' || o.status_atual === 'Envase')
    );
    const bad = done.filter((o) => o.status_atual === 'Reprovado').length;
    out[m] = { rate: done.length ? (bad / done.length) * 100 : 0, n: done.length };
  });
  return out;
}

const brl = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

export default function FabricaVivaView() {
  const { ops } = useOP();

  const columns = STAGES.map((s) => ({ ...s, lots: ops.filter((o) => s.match.includes(o.status_atual)) }));
  const worst = columns.reduce((a, b) => (b.lots.length > a.lots.length ? b : a));
  const totalFlow = columns.reduce((n, c) => n + c.lots.length, 0);

  const concluidas = ops.filter((o) => o.status_atual === 'Concluído');
  const custoBaldes = concluidas.reduce((s, o) => s + calculatePerdaBaldes(o) * CUSTO_BALDE, 0);
  const custoParadas = concluidas.reduce((s, o) => s + (o.dados_producao.tempo_parada_min ?? 0) * CUSTO_MIN_PARADA, 0);
  const custoRetrabalho = ops
    .filter((o) => o.status_atual === 'Reprovado')
    .reduce((s, o) => s + o.quantidade_planejada * CUSTO_UNIDADE_REPROVADA, 0);
  const atrasoMin = (o: ProducaoOP) =>
    o.prazo && o.timestamps.envase_finalizado_em ? Math.max(0, (new Date(o.timestamps.envase_finalizado_em).getTime() - new Date(o.prazo).getTime()) / 6e4) : 0;
  const custoAtrasos = ops.reduce((s, o) => s + atrasoMin(o) * CUSTO_MIN_PARADA, 0);
  const custos = [
    { label: 'Envase (baldes perdidos)', v: custoBaldes, color: 'bg-turquesa-500' },
    { label: 'Paradas de linha', v: custoParadas, color: 'bg-amber-500' },
    { label: 'Retrabalho / reprovação', v: custoRetrabalho, color: 'bg-rose-500' },
    { label: 'Atrasos de envase (fim após o prazo)', v: custoAtrasos, color: 'bg-cacau-600' },
  ];
  const totalCusto = custos.reduce((s, c) => s + c.v, 0);
  const maxCusto = Math.max(...custos.map((c) => c.v), 1);

  const risk = riskByMixer(ops);
  const best: Misturador = risk['Mix 1'].rate <= risk['Mix 2'].rate ? 'Mix 1' : 'Mix 2';
  const pendentes = ops.filter((o) => o.status_atual === 'Pedido' || o.status_atual === 'Verificação' || (o.status_atual === 'Envase' && !o.timestamps.envase_iniciado_em));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Fábrica viva */}
      <GlassCard strong className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Fluxo dos lotes em tempo real</h3>
            <p className="text-xs text-slate-500">{totalFlow} lotes em andamento entre as etapas</p>
          </div>
          {totalFlow > 0 && worst.lots.length > 1 && (
            <span className="badge-danger rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
              <Flame size={14} /> Acúmulo em {worst.label}: {worst.lots.length} lotes
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
          {columns.map((c, i) => (
            <div key={c.id} className="contents">
              <div className={`rounded-2xl p-4 border ${c === worst && c.lots.length > 1 ? 'border-rose-300 bg-rose-50/60' : 'border-white/70 bg-white/40'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">{c.label}</p>
                  <span className="text-xs font-bold text-slate-500">{c.lots.length}</span>
                </div>
                <div className="space-y-2 min-h-[72px]">
                  {c.lots.length === 0 && <p className="text-xs text-slate-400">Nenhum lote nesta etapa</p>}
                  {c.lots.map((o) => {
                    const h = hoursSince(sinceOf(o));
                    const late = h > LIMITE_ESPERA_H;
                    return (
                      <div key={o.id_op} className="rounded-xl bg-white/80 px-3 py-2 flex items-center gap-2 shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${late ? 'bg-rose-500 animate-pulse' : 'bg-turquesa-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">{o.id_op}</p>
                          <p className="text-[11px] text-slate-500 truncate">{o.produto}</p>
                        </div>
                        <span className={`text-[11px] font-semibold ${late ? 'text-rose-600' : 'text-slate-500'}`}>{formatNumber(h, 1)} h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {i < columns.length - 1 && <ArrowRight className="self-center text-slate-400 hidden md:block" size={20} />}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita Viva */}
        <GlassCard strong className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-marinho-600" />
            <h3 className="text-base font-bold text-slate-800">Receita Viva: risco antes de misturar</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Calculado a partir do histórico de aprovação e reprovação no laboratório.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['Mix 1', 'Mix 2'] as Misturador[]).map((m) => (
              <div key={m} className={`rounded-xl p-3 border ${m === best ? 'border-turquesa-300 bg-turquesa-50/60' : 'border-white/70 bg-white/40'}`}>
                <p className="text-xs text-slate-500">{m}</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(risk[m].rate, 0)}%</p>
                <p className="text-[11px] text-slate-500">reprovação em {risk[m].n} lotes</p>
              </div>
            ))}
          </div>
          {pendentes.length === 0 ? (
            <p className="text-sm text-slate-500">Sem OPs aguardando mistura. Crie uma no PCP para ver a recomendação.</p>
          ) : (
            <ul className="space-y-2">
              {pendentes.map((o) => (
                <li key={o.id_op} className="text-sm text-slate-700 rounded-xl bg-white/60 px-3 py-2">
                  <b>{o.id_op}</b>: recomendamos o <b>{best}</b> ({formatNumber(risk[best].rate, 0)}% de risco histórico).
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Decisão em R$ */}
        <GlassCard strong className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-turquesa-600" />
            <h3 className="text-base font-bold text-slate-800">Onde a perda custa mais</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 my-2">{brl(totalCusto)}</p>
          <div className="space-y-3 mt-4">
            {custos.map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{c.label}</span>
                  <b>{brl(c.v)}</b>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${(c.v / maxCusto) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Premissas: R$ {CUSTO_BALDE}/balde perdido, R$ {CUSTO_MIN_PARADA}/min parado, R$ {CUSTO_UNIDADE_REPROVADA}/unidade reprovada. Ajuste no topo do arquivo.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
