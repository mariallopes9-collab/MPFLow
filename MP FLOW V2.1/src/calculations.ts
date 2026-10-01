import type { ProducaoOP, Bomba, PumpEfficiencyRow } from './types';
import { PUMP_CAPACITIES } from './data';

export function getBombaCapacity(bomba: Bomba): number {
  const cap = PUMP_CAPACITIES.find((p) => p.bomba === bomba);
  return cap ? cap.capacidade_ideal : 0;
}

export function calculateTempoLiquido(op: ProducaoOP): number {
  const total = op.dados_producao.tempo_total_envase_min ?? 0;
  const parada = op.dados_producao.tempo_parada_min ?? 0;
  return total - parada;
}

export function calculateVelocidadeReal(op: ProducaoOP): number {
  const liquido = calculateTempoLiquido(op);
  if (liquido <= 0) return 0;
  const baldes = op.dados_producao.baldes_produzidos ?? 0;
  return baldes / liquido;
}

export function calculatePerdaBaldes(op: ProducaoOP): number {
  const bomba = op.dados_producao.bomba_utilizada;
  if (!bomba) return 0;
  const capacidadeIdeal = getBombaCapacity(bomba);
  const velocidadeReal = calculateVelocidadeReal(op);
  const tempoLiquido = calculateTempoLiquido(op);
  const perda = (capacidadeIdeal - velocidadeReal) * tempoLiquido;
  return perda > 0 ? perda : 0;
}

export function calculatePumpEfficiency(ops: ProducaoOP[]): PumpEfficiencyRow[] {
  return PUMP_CAPACITIES.map((pc) => {
    const pumpOps = ops.filter(
      (op) =>
        op.status_atual === 'Concluído' &&
        op.dados_producao.bomba_utilizada === pc.bomba
    );
    let totalParada = 0;
    let totalPerda = 0;
    let totalVelocidade = 0;

    pumpOps.forEach((op) => {
      totalParada += op.dados_producao.tempo_parada_min ?? 0;
      totalPerda += calculatePerdaBaldes(op);
      totalVelocidade += calculateVelocidadeReal(op);
    });

    const velocidadeMedia = pumpOps.length > 0 ? totalVelocidade / pumpOps.length : 0;

    return {
      bomba: pc.bomba,
      capacidade_ideal: pc.capacidade_ideal,
      velocidade_real: velocidadeMedia,
      tempo_parada_total: totalParada,
      perda_estimada_baldes: Math.round(totalPerda),
      ops_count: pumpOps.length,
    };
  });
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Minutos -> "Xh Ym" (usado no relatório em PDF). */
export function formatHolimetro(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/** Diferença (min) entre o holímetro final e o tempo total do lote; null se faltar dado. */
export function divergenciaHolimetroMin(op: ProducaoOP): number | null {
  const hol = op.holimetro?.valor_final_min;
  const total = op.dados_producao.tempo_total_envase_min;
  if (hol == null || total == null) return null;
  return Math.round((hol - total) * 100) / 100;
}
