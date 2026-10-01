import type { ProducaoOP } from './types';
import { nowISO } from './data';

export const audit = (op: ProducaoOP, etapa: string, usuario: string) => ({ ...op.auditoria, [etapa]: { usuario, em: nowISO() } });

export function emptyOP(id: string, produto: string, qtd: number, criado_por: string): ProducaoOP {
  return {
    id_op: id, produto, quantidade_planejada: qtd, status_atual: 'Pedido',
    codigo_barras: `MP${id.replace('OP-', '')}${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
    prazo: null, materiais: [], pendencias: [], quantidade_envase: null, misturador_utilizado: null,
    dados_qualidade: { ph: null, densidade_inicial: null, densidade_final: null, placas: null, aprovado_por: null, reprovado_por: null, justificativa_reprovacao: null },
    dados_producao: { bomba_utilizada: null, baldes_produzidos: null, tempo_total_envase_min: null, tempo_parada_min: null },
    laboratorio: null, auditoria: {}, criado_por, checklist: {},
    timestamps: { criado_em: nowISO(), mistura_iniciada_em: null, mistura_finalizada_em: null, lab_aprovado_em: null, lab_reprovado_em: null, envase_iniciado_em: null, envase_finalizado_em: null },
  };
}

const t = (h: number) => new Date(Date.now() + h * 36e5).toISOString().slice(0, 16);
const mats = [
  { nome: 'Resina acrílica', quantidade: '120 kg', disponivel: true },
  { nome: 'Carbonato de cálcio', quantidade: '300 kg', disponivel: true },
  { nome: 'Aditivo espessante', quantidade: '8 kg', disponivel: true },
];
const q = (ph: number, di: number, df: number, placas: number, aprov: string | null = null) => ({ ph, densidade_inicial: di, densidade_final: df, placas, aprovado_por: aprov, reprovado_por: null, justificativa_reprovacao: null });

function mk(id: string, produto: string, qtd: number, patch: Partial<ProducaoOP>): ProducaoOP {
  return { ...emptyOP(id, produto, qtd, 'Ana Costa'), materiais: mats, prazo: t(24), ...patch };
}
const feito = (inicio: number, fim: number, baldes: number, bomba: 'Bomba A' | 'Bomba B', parada: number) => ({
  quantidade_envase: baldes, misturador_utilizado: 'Mix 1' as const,
  dados_producao: { bomba_utilizada: bomba, baldes_produzidos: baldes, tempo_total_envase_min: Math.round((fim - inicio) * 60), tempo_parada_min: parada },
  timestamps: { ...emptyOP('x', '', 0, '').timestamps, envase_iniciado_em: t(inicio), envase_finalizado_em: t(fim) },
});

export const SEED_OPS: ProducaoOP[] = [
  mk('OP-2401', 'Massa Corrida', 800, { status_atual: 'Concluído', prazo: t(-30), dados_qualidade: q(8.4, 1.6, 1.7, 12, 'Carla Lima'), ...feito(-36, -28, 780, 'Bomba A', 40), laboratorio: { lote: 'L2401', validade: '2027-09-30', obs: '' } }),
  mk('OP-2402', 'Tinta Dupla Ação', 600, { status_atual: 'Concluído', prazo: t(-10), dados_qualidade: q(8.1, 1.3, 1.35, 10, 'Carla Lima'), ...feito(-20, -12, 600, 'Bomba B', 10), laboratorio: { lote: 'L2402', validade: '2027-09-30', obs: '' } }),
  mk('OP-2403', 'Massa Acrílica', 500, { status_atual: 'Reprovado', ...feito(-18, -14, 480, 'Bomba A', 25), misturador_utilizado: 'Mix 2', dados_qualidade: { ...q(7.2, 1.5, 1.4, 8), reprovado_por: 'Carla Lima', justificativa_reprovacao: 'Viscosidade fora da especificação' } }),
  mk('OP-2404', 'Tinta Casa Flex', 900, { status_atual: 'Laboratório', dados_qualidade: q(8.0, 1.25, 1.3, 11), ...feito(-6, -1, 900, 'Bomba B', 15) }),
  mk('OP-2405', 'Textura Acrílica', 400, { status_atual: 'Envase', dados_qualidade: q(8.3, 1.7, 1.75, 9), quantidade_envase: 400, misturador_utilizado: 'Mix 1', dados_producao: { bomba_utilizada: 'Bomba A', baldes_produzidos: 130, tempo_total_envase_min: null, tempo_parada_min: null }, timestamps: { ...emptyOP('x', '', 0, '').timestamps, envase_iniciado_em: t(-0.2) }, prazo: t(2) }),
  mk('OP-2406', 'Cola Multiperfil', 300, { status_atual: 'Verificação' }),
  mk('OP-2407', 'Fundo Preparador', 250, { status_atual: 'Pedido', materiais: [...mats.slice(0, 2), { nome: 'Aditivo espessante', quantidade: '8 kg', disponivel: false }], pendencias: [{ texto: 'Solicitar compra do aditivo espessante', feito: false }] }),
];
