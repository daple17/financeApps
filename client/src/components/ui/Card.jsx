import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
