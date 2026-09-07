import React from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  ...props
}) {
  return (
    <div
      className={`bg-[#1E222B] border border-[#2D3342] rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-5 py-4 border-b border-[#2D3342] flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-gray-100 text-sm tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-[#191D24] border-t border-[#2D3342] text-xs text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
}
