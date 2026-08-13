import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = ''
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-blue-50 text-brand-primary border-blue-100',
    success: 'bg-green-50 text-brand-success border-green-100',
    warning: 'bg-amber-50 text-brand-warning border-amber-100',
    danger: 'bg-red-50 text-brand-danger border-red-100',
    info: 'bg-sky-50 text-brand-info border-sky-100',
    neutral: 'bg-brand-bg-secondary text-brand-text-secondary border-brand-border'
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-0.5 text-[10px]'
  };

  return (
    <span
      className={`font-bold inline-flex items-center gap-1 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
