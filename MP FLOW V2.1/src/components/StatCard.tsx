import * as Icons from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accent?: 'blue' | 'green' | 'amber' | 'rose';
  index?: number;
}

const accentColors: Record<string, string> = {
  blue: 'from-marinho-400 to-marinho-600',
  green: 'from-turquesa-400 to-turquesa-500',
  amber: 'from-amber-400 to-orange-500',
  rose: 'from-vinho-500 to-vinho-700',
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendDirection = 'neutral',
  accent = 'blue',
  index = 0,
}: StatCardProps) {
  const Icon = (Icons[icon as keyof typeof Icons] ?? Icons.Circle) as Icons.LucideIcon;
  const TrendIcon =
    trendDirection === 'up'
      ? Icons.ArrowUpRight
      : trendDirection === 'down'
      ? Icons.ArrowDownRight
      : Icons.Minus;
  const trendColor =
    trendDirection === 'up'
      ? 'text-turquesa-600'
      : trendDirection === 'down'
      ? 'text-rose-500'
      : 'text-slate-500';

  return (
    <div
      className="glass-strong rounded-2xl p-5 animate-fade-in hover:scale-[1.02] transition-transform duration-300"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1.5">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendColor}`}>
              <TrendIcon size={14} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentColors[accent]} flex items-center justify-center shadow-md`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
