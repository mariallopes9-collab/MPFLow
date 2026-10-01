import type { jsPDF } from 'jspdf';

/**
 * Identidade visual dos PDFs — Majuth Flow.
 * Paleta da marca: #C9031A (vermelho), #9D1722 (vinho, cor principal dos PDFs),
 * #4A2723 (marrom), #07A2A6 (turquesa) e #FFECCB (creme).
 */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const COR = {
  principal: hexToRgb('#9D1722'), // cor principal dos PDFs (vinho da marca)
  vermelho: hexToRgb('#C9031A'),
  vinho: hexToRgb('#9D1722'),
  marrom: hexToRgb('#4A2723'),
  turquesa: hexToRgb('#07A2A6'),
  creme: hexToRgb('#FFECCB'),
  cremeClaro: hexToRgb('#FFF7E8'), // creme bem suave, p/ linhas alternadas das tabelas
  texto: [30, 41, 59] as [number, number, number],
};

export const EMPRESA = 'Majuth Flow';
export const SLOGAN = 'Precisou? Chamou!';

/** Onde o conteúdo começa / termina em cada página (mm), respeitando cabeçalho e rodapé. */
export const PDF_TOPO = 42;
export const PDF_RODAPE = 24;

/** Ligue/desligue a marca d'água discreta (logo bem clarinha ao centro de cada página). */
const MARCA_DAGUA = true;
const MARCA_DAGUA_OPACIDADE = 0.05;

// Logo "logo.png" recortada e otimizada (640x213) em base64 — assim o PDF não depende de arquivo externo.
const LOGO_PNG_BASE64 =
  'data:image/png;base64,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';
const LOGO_PROPORCAO = 640 / 213;

type DocComOpacidade = {
  GState: new (o: { opacity: number }) => unknown;
  setGState: (g: unknown) => void;
};

const setOpacidade = (doc: jsPDF, opacity: number) => {
  const d = doc as unknown as DocComOpacidade;
  d.setGState(new d.GState({ opacity }));
};

function marcaDagua(doc: jsPDF) {
  if (!MARCA_DAGUA) return;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const w = Math.min(W * 0.6, 130);
  const h = w / LOGO_PROPORCAO;
  setOpacidade(doc, MARCA_DAGUA_OPACIDADE);
  doc.addImage(LOGO_PNG_BASE64, 'PNG', (W - w) / 2, (H - h) / 2, w, h);
  setOpacidade(doc, 1);
}

function cabecalho(doc: jsPDF, titulo: string, geradoEm: string) {
  const W = doc.internal.pageSize.getWidth();

  // faixa principal (vinho)
  doc.setFillColor(...COR.principal);
  doc.rect(0, 0, W, 24, 'F');
  // fio de destaque nas cores da marca
  doc.setFillColor(...COR.vermelho);
  doc.rect(0, 24, W * 0.35, 1.4, 'F');
  doc.setFillColor(...COR.turquesa);
  doc.rect(W * 0.35, 24, W * 0.65, 1.4, 'F');

  // nome + slogan
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
  doc.text(EMPRESA, 14, 12.5);
  doc.setTextColor(...COR.creme);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
  doc.text(SLOGAN, 14, 19.5);

  // logo num cartão branco (a logo tem texto escuro, então precisa de fundo claro)
  const lw = 40, lh = lw / LOGO_PROPORCAO, pad = 2.6;
  const cw = lw + pad * 2, ch = lh + pad * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(W - 14 - cw, (24 - ch) / 2, cw, ch, 2.5, 2.5, 'F');
  doc.addImage(LOGO_PNG_BASE64, 'PNG', W - 14 - cw + pad, (24 - ch) / 2 + pad, lw, lh);

  // faixa creme com título do documento e data
  doc.setFillColor(...COR.creme);
  doc.rect(0, 25.4, W, 9, 'F');
  doc.setTextColor(...COR.principal);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
  doc.text(titulo, 14, 31.4);
  doc.setTextColor(...COR.marrom);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text(`Gerado em ${geradoEm}`, W - 14, 31.4, { align: 'right' });
}

function rodape(doc: jsPDF, pagina: number, total: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COR.turquesa);
  doc.setLineWidth(0.5);
  doc.line(14, H - 19, W - 14, H - 19);

  // logo pequena à esquerda
  const lh = 9, lw = lh * LOGO_PROPORCAO;
  doc.addImage(LOGO_PNG_BASE64, 'PNG', 14, H - 17.2, lw, lh);

  // nome + slogan + copyright ao centro
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.setTextColor(...COR.principal);
  doc.text(`${EMPRESA}  ·  ${SLOGAN}`, W / 2, H - 12.6, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.setTextColor(...COR.marrom);
  doc.text(`© ${new Date().getFullYear()} ${EMPRESA}. Todos os direitos reservados.`, W / 2, H - 8.4, { align: 'center' });

  // paginação à direita
  doc.setFontSize(8);
  doc.text(`Página ${pagina} de ${total}`, W - 14, H - 12.6, { align: 'right' });

  // faixa final vinho com ponta turquesa
  doc.setFillColor(...COR.principal);
  doc.rect(0, H - 3, W, 3, 'F');
  doc.setFillColor(...COR.turquesa);
  doc.rect(0, H - 3, 32, 3, 'F');
}

/**
 * Aplica cabeçalho, rodapé (com © e paginação) e a assinatura discreta da marca
 * em TODAS as páginas. Chame logo antes de `doc.save(...)`, com o conteúdo já montado.
 */
export function aplicarIdentidade(doc: jsPDF, titulo: string) {
  const total = doc.getNumberOfPages();
  const geradoEm = new Date().toLocaleString('pt-BR');
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    marcaDagua(doc);
    cabecalho(doc, titulo, geradoEm);
    rodape(doc, i, total);
  }
  doc.setProperties({ title: titulo, author: EMPRESA, creator: EMPRESA, subject: SLOGAN });
  doc.setTextColor(...COR.texto);
}
