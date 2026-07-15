import React from 'react';
import { GlassCard } from './GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ElementType;
}

export const MetricCard = ({ title, value, subtitle, trend, icon: Icon }: MetricCardProps) => {
  return (
    <GlassCard whileHover={{ translateY: -4 }} hoverEffect={false} className="flex flex-col gap-2 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <h3 className="text-slate-400 font-medium text-sm tracking-wide">{title}</h3>
        {Icon && <Icon size={18} className="text-core-blue opacity-70 group-hover:opacity-100 transition-opacity" />}
      </div>
      
      <div className="flex items-baseline gap-3 mt-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trend.positive ? 'text-core-green' : 'text-rose-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

      {/* Subtle background glow on hover */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-core-blue opacity-0 group-hover:opacity-10 blur-2xl rounded-full transition-all duration-500" />
    </GlassCard>
  );
};
