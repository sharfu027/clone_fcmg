import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 150,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled || !content) {
    return children;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-1.5 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-1.5 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-1.5 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-1.5 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return '-top-1 left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent';
      case 'left':
        return '-right-1 top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent';
      case 'right':
        return '-left-1 top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent';
      case 'top':
      default:
        return '-bottom-1 left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent';
    }
  };

  const contentText = typeof content === 'string' ? content : undefined;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            'aria-label': (children.props as any)?.['aria-label'] || contentText,
          })
        : children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${getPositionClasses()} z-50 pointer-events-none transition-all duration-150 ease-out animate-in fade-in-0 zoom-in-95 ${className}`}
        >
          <div className="bg-slate-900 text-white text-[11px] font-medium px-2 py-1 rounded-md shadow-md shadow-slate-900/20 whitespace-nowrap leading-tight">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 border-solid ${getArrowClasses()}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};
