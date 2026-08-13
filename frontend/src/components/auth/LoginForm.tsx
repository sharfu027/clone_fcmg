import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Key, ChevronRight } from 'lucide-react';
import { AuthenticationPolicy } from '../../types/security';

interface LoginFormProps {
  effectivePolicy: AuthenticationPolicy;
  onLoginSubmit: (email: string, pass: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  onForgotPassword: () => void;
}

export default function LoginForm({
  effectivePolicy,
  onLoginSubmit,
  onTriggerToast,
  onForgotPassword
}: LoginFormProps) {
  const [email, setEmail] = useState('admin@ink-fmcg.com');
  const [password, setPassword] = useState('EnterpriseSecure2026!');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onTriggerToast('error', 'Validation Failed', 'Please input credentials.');
      return;
    }
    onLoginSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-brand-text-primary">Corporate Email / Username</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
            placeholder="admin@ink-fmcg.com"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold text-brand-text-primary">Password</label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] font-semibold text-brand-primary hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border rounded-md border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-mono"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-brand-primary hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
      >
        <Key size={14} /> Sign In & Evaluate Policy <ChevronRight size={14} />
      </button>
    </form>
  );
}
