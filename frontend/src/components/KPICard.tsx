import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    type: 'positive' | 'warning' | 'negative' | 'neutral' | 'info';
  };
  highlight?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  highlight = false,
}) => {
  const getDotColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-400';
      case 'warning':
        return 'bg-amber-400';
      case 'negative':
        return 'bg-rose-400';
      case 'info':
        return 'bg-sky-400';
      default:
        return 'bg-zinc-400';
    }
  };

  return (
    <div
      className={`obsidian-card-interactive rounded-lg p-4 flex flex-col justify-between ${
        highlight ? 'border-neutral-700/80 bg-neutral-900/40' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
          {title}
        </span>
        {badge && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-300">
            <span className={`h-1.5 w-1.5 rounded-full ${getDotColor(badge.type)}`} />
            {badge.text}
          </span>
        )}
      </div>

      <div className="my-3 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
          {value !== null && value !== undefined ? value.toLocaleString() : '—'}
        </span>
        {unit && <span className="font-mono text-xs text-neutral-400">{unit}</span>}
      </div>

      {subtitle && (
        <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
