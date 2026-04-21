
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#F8F9FA] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Ornaments (Leaf Patterns) */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none rotate-90">
                <img src="/branding/afia_logo.png" className="w-full h-full object-contain grayscale brightness-150" alt="" />
            </div>
            <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10 pointer-events-none -rotate-90">
                <img src="/branding/afia_logo.png" className="w-full h-full object-contain grayscale brightness-150" alt="" />
            </div>

            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                {/* Logo Section */}
                <div className="relative">
                    <div className="w-48 h-48 md:w-64 md:h-64 relative z-10">
                        <img
                            src="/branding/afia_logo.png"
                            alt="Afia Logo"
                            className="w-full h-full object-contain filter drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black flex items-center justify-center gap-3">
                        <span className="text-[#F8961E] drop-shadow-sm">عافية</span>
                        <span className="text-[#2D6A4F] drop-shadow-sm">ألف</span>
                    </h1>
                    <p className="text-2xl md:text-3xl font-black text-[#333333] tracking-[0.3em] uppercase">
                        ALF AFIA
                    </p>
                </div>

                {/* Progress Bar Container */}
                <div className="w-64 md:w-96 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner mt-8 relative">
                    <div
                        className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(45,106,79,0.4)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-brand-dark font-bold text-lg animate-pulse">
                    جاري التحميل...
                </p>
            </div>

            <div className="absolute bottom-8 text-sm text-gray-400 font-bold tracking-widest flex flex-col items-center gap-1">
                <span>DIGITAL POS SYSTEM</span>
                <div className="w-12 h-1 bg-brand-accent/30 rounded-full mt-1"></div>
            </div>
        </div>
    );
};

export default SplashScreen;
