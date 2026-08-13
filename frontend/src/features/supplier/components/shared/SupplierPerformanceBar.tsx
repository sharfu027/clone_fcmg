import React from 'react';
import { getPerformanceColor, getPerformanceTextColor } from '../../utils/supplierUtils';

interface Props {
  label: string;
  value: number;
  unit?: string;
  invert?: boolean; // for defect rate (lower is better)
}

export function SupplierPerformanceBar({ label, value, unit = '%', invert = false }: Props) {
  const displayPct = invert ? 100 - value : value;
  const barColor = getPerformanceColor(displayPct);
  const textColor = getPerformanceTextColor(displayPct);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-brand-text-secondary">{label}</span>
        <span className={`font-bold ${textColor}`}>{value}{unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(displayPct, 100)}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          aria-label={label}
        />
      </div>
    </div>
  );
}
