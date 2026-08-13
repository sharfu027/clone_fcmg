import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = ''
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={14} className="text-brand-text-secondary absolute left-3" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 text-xs border border-brand-border bg-brand-bg-secondary/50 rounded focus:outline-none focus:border-brand-primary focus:bg-white transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
