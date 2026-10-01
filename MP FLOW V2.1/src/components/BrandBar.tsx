import { EMPRESA, SLOGAN } from '../pdfBrand';

/**
 * Identidade Majuth Flow na interface (V2.1).
 * A logo agora é só uma assinatura discreta no canto da página, como um copyright:
 * sem faixas, sem barras coloridas e sem destaque.
 */

const LOGO = '/majuth-flow-logo.png';

/** Mantido para não mudar a estrutura das telas: o topo não exibe mais a faixa/barra. */
export function BrandHeader() {
  return null;
}

/** Assinatura discreta no canto inferior direito: logo pequena + copyright. */
export function BrandFooter() {
  return (
    <div className="brand-credit mt-4 flex items-center justify-end gap-2.5 text-right">
      <p className="text-[11px] leading-tight text-slate-500">
        <span className="font-semibold">{EMPRESA}</span> · {SLOGAN}
        <br />© {new Date().getFullYear()} {EMPRESA}. Todos os direitos reservados.
      </p>
      <img src={LOGO} alt={EMPRESA} className="h-5 w-auto flex-shrink-0" />
    </div>
  );
}
