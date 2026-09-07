import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'success', 'warning', 'danger', 'info', 'brand', 'neutral'
  className = '',
  size = 'md'
}) {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    brand: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    neutral: 'bg-gray-700/30 text-gray-300 border-gray-600/40'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
