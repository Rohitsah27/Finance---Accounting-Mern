import React from 'react';

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon: Icon,
  description,
  accentColor = 'orange'
}) {
  const accentBorder = {
    orange: 'hover:border-orange-500/50',
    blue: 'hover:border-blue-500/50',
    emerald: 'hover:border-emerald-500/50',
    purple: 'hover:border-purple-500/50'
  };

  const accentIcon = {
    orange: 'bg-orange-500/10 text-orange-400',
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400'
  };

  return (
    <div className={`bg-[#1E222B] border border-[#2D3342] rounded-xl p-4 shadow-sm transition-all duration-200 ${accentBorder[accentColor] || accentBorder.orange}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${accentIcon[accentColor] || accentIcon.orange}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white tabular-nums">{value}</span>
        {change && (
          <span className={`text-xs font-semibold ${changeType === 'positive' ? 'text-emerald-400' : changeType === 'negative' ? 'text-rose-400' : 'text-gray-400'}`}>
            {change}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
}
