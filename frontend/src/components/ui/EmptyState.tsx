import React from 'react';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComp = icon as React.ComponentType<{ size?: number }>;
      return <IconComp size={32} />;
    }
    return null;
  };

  return (
    <div className="bg-white p-12 text-center rounded-lg border border-brand-border shadow-sm space-y-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center mx-auto">
          {renderIcon()}
        </div>
      )}
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-base font-bold text-brand-text-primary">{title}</h3>
        {description && (
          <p className="text-xs text-brand-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="flex justify-center gap-2">{action}</div>}
    </div>
  );
}
