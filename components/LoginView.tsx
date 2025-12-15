
import React, { useState } from 'react';
import { Mail, Lock, Loader2, Coffee } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network request for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await onLogin(email, password);
    
    if (!success) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsLoading(false);
    }
    // If success, parent component will unmount this view, so no need to set loading false
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f5f2] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-gold-200/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[10%] -left-[5%] w-[30%] h-[30%] bg-coffee-800/5 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-gold-100 z-10 animate-in fade-in zoom-in-95 duration-500 relative">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-gold-100">
             <Coffee size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-coffee-900">نظام نقطة البيع الذهبي</h1>
          <p className="text-gray-500 text-sm mt-2">تسجيل الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* Email Input */}
           <div className="space-y-2">
              <label className="text-sm font-bold text-coffee-900 block mr-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                   <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all text-left text-coffee-900 font-bold placeholder-gray-400" 
                  placeholder="admin@cafesun.com"
                  dir="ltr"
                />
              </div>
           </div>

           {/* Password Input */}
           <div className="space-y-2">
              <label className="text-sm font-bold text-coffee-900 block mr-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                   <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all text-left text-coffee-900 font-bold placeholder-gray-400"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
           </div>

           {error && (
             <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center font-bold animate-in fade-in slide-in-from-top-2">
               {error}
             </div>
           )}

           <button 
             type="submit"
             disabled={isLoading}
             className="w-full bg-coffee-900 hover:bg-gold-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {isLoading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
           </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400">جميع الحقوق محفوظة © Cafe Sun 2023</p>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
