import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-brand-bg-secondary flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center animate-fade-in">
        {/* Enterprise Brand Badge */}
        <div className="w-16 h-16 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-blue-50">
          I
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">INK FMCG ERP</h1>
          <p className="text-xs text-brand-text-secondary font-medium">Enterprise Distribution & Resource Planning</p>
        </div>

        {/* Loading Indicator & Status Message */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-primary bg-white px-4 py-2 rounded-full border border-brand-border shadow-xs mt-4">
          <Loader2 size={16} className="animate-spin text-brand-primary" />
          <span>Checking secure session...</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-brand-text-secondary pt-6 font-mono">
          <ShieldCheck size={14} className="text-brand-success" />
          <span>IAM v16.3 Security Policy Enforced</span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
