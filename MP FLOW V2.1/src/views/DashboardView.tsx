import { useOP } from '../OPContext';
import { calculatePumpEfficiency, calculatePerdaBaldes, formatNumber } from '../calculations';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import BarChart, { BarLabels, type BarItem } from '../components/BarChart';
import { relatorioLote, relatorioGeral } from '../relatorioPdf';
import { AlertTriangle, TrendingDown, Gauge, FileDown, BarChart3 } from 'lucide-react';

export default function DashboardView() {
  const { ops, currentUser } = useOP();

  const activeOps = ops.filter(
    (op) => op.status_atual !== 'Concluído' && op.status_atual !== 'Reprovado'
  ).length;
  const completedOps = ops.filter((op) => op.status_atual === 'Concluído').length;
  const labApproved = ops.filter((op) => op.dados_qualidade.aprovado_por !== null).length;
  const labTotal = labApproved + ops.filter((op) => op.status_atual === 'Reprovado').length;
  const conformidade = labTotal > 0 ? (labApproved / labTotal) * 100 : 0;

  const pumpRows = calculatePumpEfficiency(ops);
  const totalPerda = pumpRows.reduce((sum, r) => sum + r.perda_estimada_baldes, 0);

  const recentCompleted = ops
    .filter((op) => op.status_atual === 'Concluído')
    .slice(-5)
    .reverse();

  const etapas: BarItem[] = [
    { label: 'Pedido', value: ops.filter((o) => o.status_atual === 'Pedido').length, color: 'bg-gradient-to-t from-slate-400 to-slate-300' },
    { label: 'Verificação', value: ops.filter((o) => o.status_atual === 'Verificação').length, color: 'bg-gradient-to-t from-marinho-600 to-marinho-300' },
    { label: 'Envase', value: ops.filter((o) => o.status_atual === 'Envase').length, color: 'bg-gradient-to-t from-cacau-600 to-cacau-300' },
    { label: 'Laboratório', value: ops.filter((o) => o.status_atual === 'Laboratório').length, color: 'bg-gradient-to-t from-amber-500 to-amber-300' },
    { label: 'Concluído', value: completedOps, color: 'bg-gradient-to-t from-turquesa-500 to-turquesa-300' },
    { label: 'Reprovado', value: ops.filter((o) => o.status_atual === 'Reprovado').length, color: 'bg-gradient-to-t from-rose-500 to-rose-300' },
  ];
  const perdaBomba: BarItem[] = pumpRows.map((r) => ({ label: r.bomba, value: r.perda_estimada_baldes, color: 'bg-gradient-to-t from-rose-500 to-rose-300' }));
  const velBomba: BarItem[] = pumpRows.flatMap((r) => [
    { label: `${r.bomba} ideal`, value: r.capacidade_ideal, color: 'bg-gradient-to-t from-slate-400 to-slate-300' },
    { label: `${r.bomba} real`, value: r.velocidade_real, color: 'bg-gradient-to-t from-turquesa-500 to-turquesa-300' },
  ]);
  const comMistura = ops.filter((o) => o.timestamps.mistura_finalizada_em);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-end">
        <button onClick={() => relatorioGeral(ops, currentUser.role)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-marinho-600 to-marinho-800 shadow-md">
          <FileDown size={16} /> Gerar relatório geral (PDF)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="OPs Ativas" value={activeOps} icon="Activity" accent="blue" index={0} />
        <StatCard
          label="OPs Concluídas"
          value={completedOps}
          icon="CheckCircle2"
          accent="green"
          index={1}
        />
        <StatCard
          label="Taxa de Conformidade"
          value={`${formatNumber(conformidade, 1)}%`}
          icon="ShieldCheck"
          accent="blue"
          index={2}
        />
        <StatCard
          label="Prejuízo Oculto Total"
          value={`${totalPerda} baldes`}
          icon="TrendingDown"
          accent="rose"
          trend="Perda por ineficiência"
          trendDirection="down"
          index={3}
        />
      </div>

      {/* Gráficos em barras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { t: 'Lotes por etapa', d: etapas, u: '' },
          { t: 'Perda estimada por bomba', d: perdaBomba, u: ' baldes' },
          { t: 'Velocidade ideal x real (baldes/min)', d: velBomba, u: '' },
        ].map((c) => (
          <GlassCard key={c.t} strong className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-turquesa-600" />
              <h3 className="text-sm font-bold text-slate-800">{c.t}</h3>
            </div>
            <BarChart data={c.d} unit={c.u} />
            <BarLabels data={c.d} />
          </GlassCard>
        ))}
      </div>

      {/* Pump Efficiency Table */}
      <GlassCard strong className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-400/15 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Indicador de Prejuízo Oculto — Eficiência das Bombas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compara a velocidade ideal com a velocidade real e calcula a perda em baldes
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Equipamento
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Velocidade Ideal
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Velocidade Real
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tempo de Parada
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Perda Estimada
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  OPs
                </th>
              </tr>
            </thead>
            <tbody>
              {pumpRows.map((row) => {
                const isLoss = row.perda_estimada_baldes > 0;
                const efficiency =
                  row.capacidade_ideal > 0
                    ? (row.velocidade_real / row.capacidade_ideal) * 100
                    : 0;
                return (
                  <tr
                    key={row.bomba}
                    className="border-b border-slate-100/60 hover:bg-white/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{row.bomba}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {row.capacidade_ideal} baldes/min
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-slate-700">
                        {row.velocidade_real > 0
                          ? `${formatNumber(row.velocidade_real, 2)} baldes/min`
                          : '—'}
                      </span>
                      {row.velocidade_real > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Gauge size={12} className="text-slate-400" />
                          <span
                            className={`text-[10px] font-medium ${
                              efficiency >= 90
                                ? 'text-turquesa-600'
                                : efficiency >= 75
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {formatNumber(efficiency, 0)}% eficiência
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {row.tempo_parada_total > 0
                        ? `${row.tempo_parada_total} min`
                        : '0 min'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isLoss
                            ? 'bg-rose-400/15 text-rose-600'
                            : 'bg-turquesa-400/15 text-turquesa-600'
                        }`}
                      >
                        {isLoss && <TrendingDown size={12} />}
                        {row.perda_estimada_baldes} baldes
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{row.ops_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Recent Completed OPs with Loss Detail */}
      <GlassCard strong className="p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          OPs Concluídas — Detalhe de Perda por Bomba
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  OP
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Produto
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Bomba
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Baldes
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  T. Líquido
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Vel. Real
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Perda
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fim da mistura
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Relatório
                </th>
              </tr>
            </thead>
            <tbody>
              {recentCompleted.map((op) => {
                const perda = calculatePerdaBaldes(op);
                const tempoLiquido =
                  (op.dados_producao.tempo_total_envase_min ?? 0) -
                  (op.dados_producao.tempo_parada_min ?? 0);
                const baldes = op.dados_producao.baldes_produzidos ?? 0;
                const velReal = tempoLiquido > 0 ? baldes / tempoLiquido : 0;
                return (
                  <tr
                    key={op.id_op}
                    className="border-b border-slate-100/60 hover:bg-white/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">{op.id_op}</td>
                    <td className="px-4 py-3 text-slate-600">{op.produto}</td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {op.dados_producao.bomba_utilizada}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {baldes.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{tempoLiquido} min</td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {formatNumber(velReal, 2)} b/min
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          perda > 0
                            ? 'bg-rose-400/15 text-rose-600'
                            : 'bg-turquesa-400/15 text-turquesa-600'
                        }`}
                      >
                        {Math.round(perda)} baldes
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">
                      {op.timestamps.mistura_finalizada_em ? new Date(op.timestamps.mistura_finalizada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={op.status_atual} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => relatorioLote(op, currentUser.role)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-turquesa-700 bg-turquesa-400/15 whitespace-nowrap">
                        <FileDown size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Fim da mistura por lote */}
      <GlassCard strong className="p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">Fim da mistura por lote</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">OP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Fim da mistura</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {comMistura.map((op) => (
                <tr key={op.id_op} className="border-b border-slate-100/60 hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{op.id_op}</td>
                  <td className="px-4 py-3 text-slate-600">{op.produto}</td>
                  <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">{new Date(op.timestamps.mistura_finalizada_em!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={op.status_atual} /></td>
                </tr>
              ))}
              {comMistura.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma mistura finalizada ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
