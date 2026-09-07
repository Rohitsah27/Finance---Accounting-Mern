import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'danger', 'success'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#16191F]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-[var(--color-brand,#F97316)] hover:bg-[var(--color-brand-hover,#EA580C)] text-white shadow-sm shadow-orange-950/40 focus:ring-orange-500',
    secondary: 'bg-[#252A34] hover:bg-[#2F3542] text-gray-200 border border-[#373E4F] focus:ring-gray-400',
    ghost: 'bg-transparent hover:bg-[#252A34] text-gray-300 hover:text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-950/40 focus:ring-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-950/40 focus:ring-emerald-500'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}
