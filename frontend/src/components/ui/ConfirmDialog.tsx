import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const btnVariant = {
    danger: 'bg-brand-danger hover:bg-red-700 text-white',
    warning: 'bg-brand-warning hover:bg-amber-700 text-white',
    primary: 'bg-brand-primary hover:bg-blue-700 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-brand-border max-w-sm w-full p-6 space-y-4 shadow-xl-flat">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-brand-warning flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-brand-text-primary">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-brand-text-secondary leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border border-brand-border text-xs font-semibold text-brand-text-primary rounded hover:bg-brand-bg-secondary cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-semibold rounded cursor-pointer shadow-xs ${btnVariant[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
