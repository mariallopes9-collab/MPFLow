import type { ReactNode } from 'react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import type { ProducaoOP } from '../types';

export const inputCls = 'w-full glass-subtle rounded-xl px-3 py-2.5 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-marinho-400/40';
export const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';
export const btnPrimary = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-marinho-600 to-marinho-800 shadow-md disabled:opacity-40 disabled:cursor-not-allowed';
export const btnGhost = 'px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/40';

export const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function OPCard({ op, children, actions }: { op: ProducaoOP; children?: ReactNode; actions?: ReactNode }) {
  return (
    <GlassCard strong className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-400 font-semibold">{op.id_op}</p>
          <h4 className="text-base font-bold text-slate-800">{op.produto || 'Novo pedido'}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{op.quantidade_planejada.toLocaleString('pt-BR')} un · prazo {fmt(op.prazo)}</p>
        </div>
        <StatusBadge status={op.status_atual} />
      </div>
      {children && <div className="mt-4">{children}</div>}
      {actions && <div className="mt-4 flex justify-end gap-2 flex-wrap">{actions}</div>}
    </GlassCard>
  );
}

export function Empty({ text }: { text: string }) {
  return <GlassCard strong className="p-8 text-center text-sm text-slate-400">{text}</GlassCard>;
}
