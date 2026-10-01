import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProducaoOP } from './types';
import { COR, PDF_RODAPE, PDF_TOPO, aplicarIdentidade } from './pdfBrand';
import { calculatePerdaBaldes, calculatePumpEfficiency, calculateVelocidadeReal, divergenciaHolimetroMin, formatHolimetro } from './calculations';

// Sobrescreve a cor principal (anteriormente vermelho) para azul marinho RGB [0, 32, 96]
COR.principal = [0, 32, 96];

const dt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const v = (x: unknown) => (x === null || x === undefined || x === '' ? '—' : String(x));

const tabela = (doc: jsPDF, startY: number, head: string[], body: string[][], titulo?: string) => {
  // se o título da seção cairia colado no rodapé, começa numa página nova
  if (startY > doc.internal.pageSize.getHeight() - PDF_RODAPE - 30) { doc.addPage(); startY = PDF_TOPO; }
  if (titulo) {
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR.principal); doc.text(titulo, 14, startY); doc.setTextColor(...COR.texto);
    startY += 3;
  }
  autoTable(doc, {
    startY, head: [head], body, theme: 'grid',
    styles: { fontSize: 8.5, textColor: COR.texto, lineColor: [226, 214, 196] },
    headStyles: { fillColor: COR.principal, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: COR.cremeClaro },
    margin: { left: 14, right: 14, top: PDF_TOPO, bottom: PDF_RODAPE },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
};

/** O relatório em PDF é exclusivo do gerente. */
const soGerente = (cargo: string) => cargo === 'Gerente';

/** Relatório final de um lote (OP). */
export function relatorioLote(op: ProducaoOP, cargo: string) {
  if (!soGerente(cargo)) return;
  const doc = new jsPDF();
  doc.setTextColor(...COR.texto);
  const dp = op.dados_producao, dq = op.dados_qualidade, t = op.timestamps;
  let y = PDF_TOPO;
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(`${op.id_op} · ${op.produto}`, 14, y); y += 6;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`Status final: ${op.status_atual} · Código de barras: ${op.codigo_barras}`, 14, y); y += 6;

  y = tabela(doc, y, ['Pedido', 'Valor'], [
    ['Quantidade planejada', `${op.quantidade_planejada} un`], ['Quantidade envasada', v(dp.baldes_produzidos)],
    ['Prazo', dt(op.prazo)], ['Criado por', v(op.criado_por)],
  ], 'Pedido');
  if (op.solicitacao) {
    const so = op.solicitacao;
    y = tabela(doc, y, ['Solicitação do gerente', 'Valor'], [
      ['Solicitado por', v(so.solicitado_por)], ['Enviado em', dt(so.em)], ['Prioridade', so.prioridade], ['Anotação', v(so.texto)],
    ], 'Solicitação do gerente');
  }
  y = tabela(doc, y, ['Material', 'Quantidade', 'Disponível'], op.materiais.map((m) => [m.nome, m.quantidade, m.disponivel ? 'Sim' : 'Não']), 'Materiais');
  y = tabela(doc, y, ['Qualidade', 'Valor'], [
    ['pH', v(dq.ph)], ['Densidade inicial', v(dq.densidade_inicial)], ['Densidade final', v(dq.densidade_final)], ['Placas', v(dq.placas)],
    ['Aprovado por', v(dq.aprovado_por)], ['Reprovado por', v(dq.reprovado_por)], ['Justificativa da reprovação', v(dq.justificativa_reprovacao)],
  ], 'Verificação e qualidade');
  y = tabela(doc, y, ['Produção', 'Valor'], [
    ['Misturador', v(op.misturador_utilizado)], ['Bomba', v(dp.bomba_utilizada)],
    ['Fim da mistura', dt(t.mistura_finalizada_em)], ['Início do envase', dt(t.envase_iniciado_em)], ['Fim do envase', dt(t.envase_finalizado_em)],
    ['Tempo total (min)', v(dp.tempo_total_envase_min)], ['Peso total (kg)', v(dp.peso_total_kg)], ['Holímetro final (última leitura)', op.holimetro?.valor_final_min != null ? `${op.holimetro.valor_final_min} min (${formatHolimetro(op.holimetro.valor_final_min)})` : '—'],
    ['Holímetro x tempo do lote (min)', divergenciaHolimetroMin(op) !== null ? String(divergenciaHolimetroMin(op)) : '—'], ['Tempo parado (min)', v(dp.tempo_parada_min)],
    ['Velocidade real (baldes/min)', calculateVelocidadeReal(op).toFixed(2)], ['Perda estimada (baldes)', String(Math.round(calculatePerdaBaldes(op)))],
  ], 'Mistura e envase');
  y = tabela(doc, y, ['Laboratório', 'Valor'], [
    ['Lote', v(op.laboratorio?.lote)], ['Validade', v(op.laboratorio?.validade)], ['Observações', v(op.laboratorio?.obs)], ['Aprovado em', dt(t.lab_aprovado_em)], ['Reprovado em', dt(t.lab_reprovado_em)],
  ], 'Laboratório');
  tabela(doc, y, ['Etapa', 'Responsável (Face ID)', 'Data/hora'], Object.entries(op.auditoria).map(([e, a]) => [e, a.usuario, dt(a.em)]), 'Auditoria');
  aplicarIdentidade(doc, `Relatório do lote ${op.id_op}`);
  doc.save(`relatorio-${op.id_op}.pdf`);
}

/** Relatório geral do dashboard (todos os lotes). */
export function relatorioGeral(ops: ProducaoOP[], cargo: string) {
  if (!soGerente(cargo)) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setTextColor(...COR.texto);
  const concl = ops.filter((o) => o.status_atual === 'Concluído').length;
  const reprov = ops.filter((o) => o.status_atual === 'Reprovado').length;
  let y = PDF_TOPO;
  doc.setFontSize(10); doc.text(`Total de OPs: ${ops.length} · Concluídas: ${concl} · Reprovadas: ${reprov} · Em andamento: ${ops.length - concl - reprov}`, 14, y); y += 6;
  y = tabela(doc, y, ['Bomba', 'Vel. ideal', 'Vel. real', 'Tempo parado (min)', 'Perda (baldes)', 'OPs'],
    calculatePumpEfficiency(ops).map((r) => [r.bomba, `${r.capacidade_ideal} b/min`, r.velocidade_real ? r.velocidade_real.toFixed(2) : '—', String(r.tempo_parada_total), String(r.perda_estimada_baldes), String(r.ops_count)]), 'Eficiência das bombas');
  tabela(doc, y, ['OP', 'Produto', 'Status', 'Bomba', 'Baldes', 'Fim da mistura', 'Fim do envase', 'Perda (baldes)', 'Lote'],
    ops.map((o) => [o.id_op, o.produto, o.status_atual, v(o.dados_producao.bomba_utilizada), v(o.dados_producao.baldes_produzidos), dt(o.timestamps.mistura_finalizada_em), dt(o.timestamps.envase_finalizado_em), String(Math.round(calculatePerdaBaldes(o))), v(o.laboratorio?.lote)]), 'Todas as ordens de produção');
  aplicarIdentidade(doc, 'Relatório geral da produção');
  doc.save('relatorio-geral.pdf');
}