import type { Column, TableRow } from '../types';

interface DataTableProps {
  columns: Column[];
  rows: TableRow[];
}

function getBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (['concluído', 'online', 'operacional', 'aprovado'].some((s) => v.includes(s)))
    return 'badge-success';
  if (['em curso', 'em análise', 'planejado', 'atenção', 'degradado', 'pausado'].some((s) => v.includes(s)))
    return 'badge-warning';
  if (['atrasado', 'parado', 'reprovado', 'reprovada'].some((s) => v.includes(s)))
    return 'badge-danger';
  if (['manutenção', 'pendente', 'crítica'].some((s) => v.includes(s)))
    return 'badge-info';
  return 'badge-neutral';
}

export default function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.width ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-100/60 hover:bg-white/30 transition-colors duration-200"
            >
              {columns.map((col) => {
                const value = String(row[col.key] ?? '');
                const isStatus = col.key === 'status' || col.key === 'resultado';
                const isPriority = col.key === 'prioridade';
                return (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-700 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.width ?? ''}`}
                  >
                    {isStatus || isPriority ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBadgeClass(value)}`}>
                        {value}
                      </span>
                    ) : (
                      <span className="font-medium">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
