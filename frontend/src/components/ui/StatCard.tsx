import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  badgeText?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  subLabel?: string;
  subValue?: string;
  progressPercent?: number;
  progressColor?: 'primary' | 'success' | 'danger' | 'warning';
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  badgeText,
  badgeVariant = 'success',
  subLabel,
  subValue,
  progressPercent,
  progressColor = 'primary',
  children
}: StatCardProps) {
  const colorMap = {
    primary: 'bg-brand-primary',
    success: 'bg-brand-success',
    danger: 'bg-brand-danger',
    warning: 'bg-brand-warning'
  };

  const badgeColorMap = {
    primary: 'bg-blue-50 text-brand-primary border-blue-100',
    success: 'bg-green-50 text-brand-success border-green-100',
    warning: 'bg-amber-50 text-brand-warning border-amber-100',
    danger: 'bg-red-50 text-brand-danger border-red-100',
    info: 'bg-sky-50 text-brand-info border-sky-100',
    neutral: 'bg-brand-bg-secondary text-brand-text-secondary border-brand-border'
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">{title}</span>
        {badgeText && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5 ${badgeColorMap[badgeVariant]}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-xl font-bold text-brand-text-primary">{value}</h3>
        {(subLabel || subValue) && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-brand-text-secondary font-medium">
            <span>{subLabel}</span>
            <span className="font-semibold">{subValue}</span>
          </div>
        )}
        {progressPercent !== undefined && (
          <div className="w-full bg-brand-bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className={`${colorMap[progressColor]} h-full rounded-full`} style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
