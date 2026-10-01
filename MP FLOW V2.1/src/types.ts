export type OPStatus = 'Pedido' | 'Verificação' | 'Envase' | 'Laboratório' | 'Concluído' | 'Reprovado';
export type Misturador = 'Mix 1' | 'Mix 2';
export type Bomba = 'Bomba A' | 'Bomba B';
export type Role = 'Gerente' | 'Qualidade' | 'Verificação' | 'Envase' | 'Laboratório';

export interface QualityData {
  ph: number | null;
  densidade_inicial: number | null;
  densidade_final: number | null;
  placas?: number | null;
  aprovado_por: string | null;
  reprovado_por: string | null;
  justificativa_reprovacao: string | null;
}
export interface ProductionData {
  bomba_utilizada: Bomba | null;
  baldes_produzidos: number | null;
  tempo_total_envase_min: number | null;
  tempo_parada_min: number | null;
  peso_total_kg?: number | null;
}
export interface Timestamps {
  criado_em: string | null;
  mistura_iniciada_em: string | null;
  mistura_finalizada_em: string | null;
  lab_aprovado_em: string | null;
  lab_reprovado_em: string | null;
  envase_iniciado_em: string | null;
  envase_finalizado_em: string | null;
}
export interface Material { nome: string; quantidade: string; disponivel: boolean }
export interface Pendencia { texto: string; feito: boolean }
export interface Auditoria { usuario: string; em: string }
export interface DadosLab { lote: string; validade: string; obs: string }

export interface ProducaoOP {
  id_op: string;
  produto: string;
  quantidade_planejada: number;
  status_atual: OPStatus;
  codigo_barras: string;
  prazo: string | null;
  materiais: Material[];
  pendencias: Pendencia[];
  quantidade_envase: number | null;
  misturador_utilizado: Misturador | null;
  dados_qualidade: QualityData;
  dados_producao: ProductionData;
  laboratorio: DadosLab | null;
  timestamps: Timestamps;
  auditoria: Record<string, Auditoria>; // quem passou pelo Face ID em cada etapa
  criado_por: string;
  checklist?: Record<string, boolean>;
  solicitacao?: { solicitado_por: string; em: string | null; prioridade: string; texto: string | null } | null;
  holimetro?: { valor_final_min: number | null } | null;
}

export interface PumpCapacity { bomba: Bomba; capacidade_ideal: number }
export interface PumpEfficiencyRow {
  bomba: Bomba; capacidade_ideal: number; velocidade_real: number;
  tempo_parada_total: number; perda_estimada_baldes: number; ops_count: number;
}
export interface CurrentUser { name: string; role: Role }
