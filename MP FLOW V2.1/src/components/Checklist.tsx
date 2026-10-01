import { CheckSquare, Square } from 'lucide-react';
import { useOP } from '../OPContext';
import type { ProducaoOP } from '../types';

export type Etapa = 'Verificação' | 'Envase' | 'Laboratório';

export const CHECKLISTS: Record<Etapa, string[]> = {
  Verificação: ['Conferir lista de materiais recebida', 'Conferir pH', 'Conferir densidade inicial e final', 'Conferir placas'],
  Envase: ['Conferir embalagem e rótulo', 'Conferir código de barras', 'Higienizar a bomba', 'Verificar vazão da bomba'],
  Laboratório: ['OK nos dados de mistura', 'OK nos dados de envase', 'OK nos dados de qualidade', 'OK no código de barras'],
};

const key = (e: Etapa, item: string) => `${e}:${item}`;

export const isChecklistComplete = (op: ProducaoOP | undefined, e: Etapa) =>
  !!op && CHECKLISTS[e].every((i) => op.checklist?.[key(e, i)]);

export default function Checklist({ opId, etapa }: { opId: string; etapa: Etapa }) {
  const { ops, toggleCheck } = useOP();
  const op = ops.find((o) => o.id_op === opId);
  const items = CHECKLISTS[etapa];
  const done = items.filter((i) => op?.checklist?.[key(etapa, i)]).length;

  return (
    <div className="glass-subtle rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-700">{opId} | {etapa}</p>
        <span className={`text-xs font-semibold ${done === items.length ? 'text-turquesa-600' : 'text-slate-500'}`}>{done}/{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((i) => {
          const on = !!op?.checklist?.[key(etapa, i)];
          return (
            <button key={i} type="button" onClick={() => toggleCheck(opId, key(etapa, i))} className="w-full flex items-center gap-2.5 text-left text-sm rounded-lg px-2 py-1.5 hover:bg-white/50">
              {on ? <CheckSquare size={18} className="text-turquesa-600" /> : <Square size={18} className="text-slate-400" />}
              <span className={on ? 'text-slate-500 line-through' : 'text-slate-700'}>{i}</span>
            </button>
          );
        })}
      </div>
      {done < items.length && <p className="text-xs text-amber-600 mt-2">Conclua todos os itens para liberar a próxima etapa.</p>}
    </div>
  );
}
