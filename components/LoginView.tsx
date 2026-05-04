import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, WifiOff, AlertCircle, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { soundService } from '../services/soundService';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Mount animation
    setTimeout(() => setIsVisible(true), 80);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const success = await onLogin(email, password);
    if (!success) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsLoading(false);
      soundService.playError();
    }
  };

  const lightGradient = 'linear-gradient(160deg, #f5fbf7 0%, #fef9f4 50%, #f5fbf7 100%)';
  const darkGradient = 'linear-gradient(160deg, var(--dm-base) 0%, #0a0e13 50%, var(--dm-base) 100%)';

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-700" 
      style={{ background: isDarkMode ? darkGradient : lightGradient }}
    >

      {/* Background blobs - Light Mode */}
      {!isDarkMode && (
        <>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #2D6A4F 0%, transparent 65%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #F8961E 0%, transparent 65%)' }} />
        </>
      )}

      {/* Background blobs - Dark Mode */}
      {isDarkMode && (
        <>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #40C980 0%, transparent 65%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #1E2E26 0%, transparent 65%)' }} />
        </>
      )}

      {/* Watermark logo */}
      <div className="absolute bottom-10 right-10 w-80 h-80 opacity-[0.04] pointer-events-none rotate-12">
        <img src="/branding/afia_logo.webp" alt="" className="w-full h-full object-contain" />
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 left-6 z-50 p-3 rounded-full transition-all duration-300 backdrop-blur-md border"
        style={{
          backgroundColor: isDarkMode ? 'var(--dm-surface)' : 'rgba(255,255,255,0.8)',
          borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(45,106,79,0.1)',
          color: isDarkMode ? 'var(--dm-green-glow)' : '#F8961E'
        }}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Card */}
      <div
        className="w-full max-w-md relative z-10 transition-all duration-700"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        }}
      >
        <div 
          className="rounded-[2.5rem] shadow-[0_20px_60px_rgba(45,106,79,0.12),0_4px_20px_rgba(0,0,0,0.06)] border overflow-hidden backdrop-blur-xl transition-all duration-500"
          style={{
            backgroundColor: isDarkMode ? 'var(--dm-surface)' : 'rgba(255,255,255,0.8)',
            borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(255,255,255,0.7)'
          }}
        >

          {/* Status bar */}
          <div 
            className={`h-10 flex items-center justify-center gap-2 transition-all duration-500 ${isOnline ? '' : 'animate-pulse'}`}
            style={{ 
              background: isOnline 
                ? (isDarkMode ? 'linear-gradient(90deg, #1E2E26, #1A4532, #40C980)' : 'linear-gradient(90deg, #1B4332, #2D6A4F, #52B788)')
                : 'linear-gradient(90deg, #dc2626, #e11d48)' 
            }}
          >
            <div className={`w-1.5 h-1.5 rounded-full bg-white ${isOnline ? '' : 'animate-ping'}`} />
            <span className="text-white text-[11px] font-bold tracking-wide">
              {isOnline ? 'متصل بالسحابة الرقمية' : 'لا يوجد اتصال بالإنترنت'}
            </span>
            {!isOnline && <WifiOff size={11} className="text-white/70" />}
          </div>

          <div className="px-10 pt-8 pb-10">

            {/* ─── Brand Identity Block ─── */}
            <div className="flex flex-col items-center mb-9" dir="rtl">

              {/* Logo */}
              <div className="relative mb-5">
                <div 
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: isDarkMode
                      ? 'radial-gradient(circle, rgba(64,201,128,0.15) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(45,106,79,0.2) 0%, transparent 70%)',
                    transform: 'scale(1.8)'
                  }}
                />
                <div className="w-24 h-24 relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300">
                  <img src="/branding/afia_logo.webp" alt="SoftyCode Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Main Arabic name */}
              <h1 className="mb-0.5 font-black text-center" style={{ fontSize: '2rem', lineHeight: 1.3, paddingBottom: '0.08em' }}>
                <span
                  key={isDarkMode ? 'dark-text' : 'light-text'}
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #40C980 0%, #1A4532 55%, #0f5a2e 100%)'
                      : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #52B788 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'block',
                    transition: 'all 0.5s ease-in-out',
                  }}
                >
                  سوفتي كود
                </span>
              </h1>

              {/* Elegant divider */}
              <div className="flex items-center justify-center gap-2 my-2 w-full max-w-[200px]">
                <div 
                  className="h-px flex-1"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(to left, rgba(64,201,128,0.3), transparent)'
                      : 'linear-gradient(to left, rgba(45,106,79,0.3), transparent)'
                  }}
                />
                <div className="flex gap-1 items-center">
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F8961E' }} />
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isDarkMode ? '#40C980' : '#2D6A4F' }}
                  />
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F8961E' }} />
                </div>
                <div 
                  className="h-px flex-1"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(to right, rgba(64,201,128,0.3), transparent)'
                      : 'linear-gradient(to right, rgba(45,106,79,0.3), transparent)'
                  }}
                />
              </div>

              {/* Arabic subtitle */}
              <p 
                className="font-bold text-center mb-3"
                style={{
                  fontSize: '1rem',
                  color: '#F8961E',
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 8px rgba(248,150,30,0.2)'
                }}
              >
                للمطاعم و الكافيهات
              </p>

              {/* English badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors duration-300"
                style={{
                  background: isDarkMode ? 'rgba(64,201,128,0.06)' : 'rgba(45,106,79,0.06)',
                  border: isDarkMode ? '1px solid rgba(64,201,128,0.12)' : '1px solid rgba(45,106,79,0.12)'
                }}
              >
                <span 
                  className="text-[10px] font-black uppercase tracking-[0.22em] transition-colors duration-300"
                  style={{
                    color: isDarkMode ? '#40C980' : '#2D6A4F',
                    opacity: 0.7
                  }}
                >
                  SOFTYCODE
                </span>
                <div 
                  className="w-px h-2.5 transition-colors duration-300"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(64,201,128,0.2)' : 'rgba(45,106,79,0.2)'
                  }}
                />
                <span 
                  className="text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
                  style={{
                    color: isDarkMode ? '#40C980' : '#2D6A4F',
                    opacity: 0.45
                  }}
                >
                  Restaurants & Cafes
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">

              {/* Email */}
              <div className="space-y-1.5">
                <label 
                  className="text-xs font-black block mr-1 uppercase tracking-widest transition-colors duration-300"
                  style={{
                    color: isDarkMode ? 'rgba(232, 234, 238, 0.6)' : 'rgba(27, 67, 50, 0.6)'
                  }}
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    style={{
                      color: isDarkMode ? 'rgba(64, 201, 128, 0.4)' : 'rgba(45, 106, 79, 0.4)'
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isOnline}
                    required
                    className="w-full pl-4 pr-12 py-4 rounded-2xl outline-none transition-all text-left font-bold placeholder-opacity-40 disabled:opacity-50 text-sm"
                    placeholder="admin@softycode.com"
                    dir="ltr"
                    style={{
                      backgroundColor: isDarkMode ? 'var(--dm-overlay)' : 'rgba(45, 106, 79, 0.06)',
                      borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(45, 106, 79, 0.1)',
                      border: '1px solid',
                      color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332',
                      caretColor: isDarkMode ? '#40C980' : '#2D6A4F'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--dm-overlay)' : 'white';
                      e.currentTarget.style.boxShadow = isDarkMode
                        ? '0 0 0 2px var(--dm-border)'
                        : '0 0 0 2px rgba(45, 106, 79, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label 
                  className="text-xs font-black block mr-1 uppercase tracking-widest transition-colors duration-300"
                  style={{
                    color: isDarkMode ? 'rgba(232, 234, 238, 0.6)' : 'rgba(27, 67, 50, 0.6)'
                  }}
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    style={{
                      color: isDarkMode ? 'rgba(64, 201, 128, 0.4)' : 'rgba(45, 106, 79, 0.4)'
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isOnline}
                    required
                    className="w-full pl-12 pr-12 py-4 rounded-2xl outline-none transition-all text-left font-bold placeholder-opacity-40 disabled:opacity-50 text-sm"
                    placeholder="••••••••"
                    dir="ltr"
                    style={{
                      backgroundColor: isDarkMode ? 'var(--dm-overlay)' : 'rgba(45, 106, 79, 0.06)',
                      borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(45, 106, 79, 0.1)',
                      border: '1px solid',
                      color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332',
                      caretColor: isDarkMode ? '#40C980' : '#2D6A4F'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--dm-overlay)' : 'white';
                      e.currentTarget.style.boxShadow = isDarkMode
                        ? '0 0 0 2px var(--dm-border)'
                        : '0 0 0 2px rgba(45, 106, 79, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors duration-300 hover:opacity-100"
                    style={{
                      color: isDarkMode ? 'rgba(64, 201, 128, 0.5)' : 'rgba(45, 106, 79, 0.5)',
                      opacity: 0.7
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && isOnline && (
                <div 
                  className="text-sm p-4 rounded-2xl text-center font-bold border flex items-center justify-center gap-2 transition-colors duration-300"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.1)' : 'rgb(254, 242, 242)',
                    color: '#F87171',
                    borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isOnline}
                className="w-full font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={(!isOnline) ? 
                  {
                    background: isDarkMode ? 'var(--dm-muted)' : '#e5e7eb',
                    color: isDarkMode ? 'var(--dm-text-2)' : '#9ca3af'
                  } : {
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #40C980 0%, #1A4532 60%, #0f5a2e 100%)'
                      : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #52B788 100%)',
                    color: '#fff',
                    boxShadow: isDarkMode
                      ? '0 8px 24px rgba(64, 201, 128, 0.25)'
                      : '0 8px 24px rgba(45,106,79,0.35)',
                  }
                }
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'دخول النظام'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p 
                className="text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-300"
                style={{
                  color: isDarkMode ? 'rgba(64, 201, 128, 0.3)' : 'rgba(45, 106, 79, 0.3)'
                }}
              >
                جميع الحقوق محفوظة © SoftyCode 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
