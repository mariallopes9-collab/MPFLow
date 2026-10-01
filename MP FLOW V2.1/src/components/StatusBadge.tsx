import type { OPStatus } from '../types';

const statusStyles: Record<OPStatus, string> = {
  Pedido: 'bg-slate-400/15 text-slate-600',
  Verificação: 'bg-marinho-500/15 text-marinho-600',
  Envase: 'bg-cacau-500/15 text-cacau-600',
  Laboratório: 'bg-amber-400/20 text-amber-700',
  Concluído: 'bg-turquesa-400/15 text-turquesa-600',
  Reprovado: 'bg-rose-400/15 text-rose-600',
};

export default function StatusBadge({ status }: { status: OPStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
