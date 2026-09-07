import React from 'react';

export function Table({
  headers,
  children,
  className = ''
}) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-[#2D3342] ${className}`}>
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-[#181B22] text-xs font-semibold uppercase text-gray-400 border-b border-[#2D3342]">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-4 py-3 tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2D3342] bg-[#1E222B]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#252A34] transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-200 ${className}`}>
      {children}
    </td>
  );
}
