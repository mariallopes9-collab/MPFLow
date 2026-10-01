import type { SectionData } from '../types';
import StatCard from './StatCard';
import DataTable from './DataTable';
import GlassCard from './GlassCard';
import { Filter, Download } from 'lucide-react';

interface SectionViewProps {
  title: string;
  subtitle: string;
  data: SectionData;
}

export default function SectionView({ title, subtitle, data }: SectionViewProps) {
  return (
    <div key={title} className="animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {data.stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Table */}
      <GlassCard strong className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Registros</h3>
            <p className="text-xs text-slate-500 mt-0.5">{data.rows.length} registros listados</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass-subtle rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-white/50 transition-colors">
              <Filter size={14} />
              Filtrar
            </button>
            <button className="glass-subtle rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-white/50 transition-colors">
              <Download size={14} />
              Exportar
            </button>
          </div>
        </div>
        <DataTable columns={data.columns} rows={data.rows} />
      </GlassCard>
    </div>
  );
}
