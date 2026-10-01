// Gráfico de barras verticais (torres) em SVG/CSS puro, sem dependências.
export interface BarItem { label: string; value: number; color?: string }

export default function BarChart({ data, unit = '', height = 180 }: { data: BarItem[]; unit?: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-around gap-2 sm:gap-4 pt-6 border-b border-slate-300/60" style={{ height: height + 24 }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 min-w-0 max-w-[110px] h-full flex flex-col justify-end items-center">
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">{Math.round(d.value * 10) / 10}{unit}</span>
          <div
            className={`w-full rounded-t-lg transition-all duration-700 ${d.color ?? 'bg-gradient-to-t from-marinho-500 to-turquesa-400'}`}
            style={{ height: `${Math.max(2, (d.value / max) * height)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export function BarLabels({ data }: { data: BarItem[] }) {
  return (
    <div className="flex justify-around gap-2 sm:gap-4 mt-1.5">
      {data.map((d) => <span key={d.label} className="flex-1 min-w-0 max-w-[110px] text-center text-[10px] sm:text-[11px] text-slate-500 leading-tight break-words">{d.label}</span>)}
    </div>
  );
}
