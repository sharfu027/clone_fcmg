import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  view: string | null;
}

interface Props {
  items: BreadcrumbItem[];
  onNavigate: (view: string) => void;
}

export function SupplierBreadcrumb({ items, onNavigate }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-brand-text-secondary mb-4">
      <Home size={12} className="shrink-0" />
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={12} className="shrink-0 text-brand-border" />}
          {item.view ? (
            <button
              onClick={() => onNavigate(item.view!)}
              className="hover:text-brand-primary hover:underline cursor-pointer font-medium transition-colors"
              aria-label={`Navigate to ${item.label}`}
            >
              {item.label}
            </button>
          ) : (
            <span className={idx === items.length - 1 ? 'text-brand-text-primary font-semibold' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
