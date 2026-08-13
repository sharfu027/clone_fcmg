import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-brand-border shadow-xs ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-brand-text-primary">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-brand-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
