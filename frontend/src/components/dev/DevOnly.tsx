/// <reference types="vite/client" />
import React from 'react';

interface DevOnlyProps {
  children: React.ReactNode;
}

export function DevOnly({ children }: DevOnlyProps) {
  const isDev = Boolean((import.meta as any).env?.DEV);
  if (!isDev) {
    return null;
  }
  return <>{children}</>;
}

export default DevOnly;
