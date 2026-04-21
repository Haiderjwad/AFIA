import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, Coffee, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;

    setError('');
    setIsLoading(true);

    // Simulate network request for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await onLogin(email, password);

    if (!success) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-cream flex items-center justify-center relative overflow-hidden font-sans">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-3xl scale-150"></div>
        <div className="absolute top-[20%] left-[5%] w-[30%] h-[30%] bg-brand-accent/5 rounded-full blur-3xl"></div>

        {/* Leaf Pattern Watermark */}
        <div className="absolute bottom-10 right-10 w-96 h-96 opacity-5 pointer-events-none rotate-12">
          <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 z-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">

        {/* Connection Status Bar */}
        <div className={`absolute top-0 left-0 right-0 h-10 flex items-center justify-center gap-2 transition-all duration-500 z-[60] ${isOnline
          ? 'bg-gradient-to-r from-brand-primary to-brand-secondary'
          : 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse'
          }`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-white animate-ping'}`}></div>
          <span className="text-white text-xs font-bold tracking-wide">
            {isOnline ? 'أنت متصل بالسحابة الرقمية' : 'لا يوجد اتصال بالإنترنت'}
          </span>
        </div>

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="w-32 h-32 relative mb-6 drop-shadow-xl hover:scale-105 transition-transform duration-300">
            <img src="/branding/afia_logo.png" alt="Afia Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black flex items-center gap-2 mb-2">
            <span className="text-brand-accent">عافية</span>
            <span className="text-brand-primary">ألف</span>
          </h1>
          <p className="text-brand-dark/60 font-bold text-sm tracking-widest uppercase">Digital POS System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-brand-dark block mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-primary/40">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isOnline}
                required
                className="w-full pl-4 pr-12 py-4 bg-brand-light/10 border border-brand-primary/10 rounded-2xl focus:ring-2 focus:ring-brand-secondary focus:bg-white outline-none transition-all text-left text-brand-dark font-bold placeholder-brand-dark/30 disabled:opacity-50"
                placeholder="admin@alfafia.com"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-brand-dark block mr-1">كلمة المرور</label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-brand-primary/40">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isOnline}
                required
                className="w-full pl-4 pr-12 py-4 bg-brand-light/10 border border-brand-primary/10 rounded-2xl focus:ring-2 focus:ring-brand-secondary focus:bg-white outline-none transition-all text-left text-brand-dark font-bold placeholder-brand-dark/30 disabled:opacity-50"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          {error && isOnline && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl text-center font-bold border border-red-100 flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isOnline}
            className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg ${!isOnline ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-brand-primary/30 text-white'}`}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'دخول النظام'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-[0.2em]">جميع الحقوق محفوظة © Alf Afia 2026</p>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
