
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const readyTimer = setTimeout(() => setIsReady(true), 100);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);
        return () => {
            clearInterval(timer);
            clearTimeout(readyTimer);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: 'linear-gradient(160deg, #f5fbf7 0%, #fef9f4 50%, #f5fbf7 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #2D6A4F 0%, transparent 70%)' }} />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #F8961E 0%, transparent 70%)' }} />

            {/* Subtle leaf watermarks */}
            <div className="absolute top-6 right-6 w-40 h-40 opacity-[0.06] pointer-events-none">
                <img src="/branding/afia_logo.png" className="w-full h-full object-contain" alt="" />
            </div>
            <div className="absolute bottom-6 left-6 w-40 h-40 opacity-[0.06] pointer-events-none rotate-180">
                <img src="/branding/afia_logo.png" className="w-full h-full object-contain" alt="" />
            </div>

            {/* Center content */}
            <div className="flex flex-col items-center justify-center h-full gap-0">

                {/* Logo with glow ring */}
                <div
                    className="relative mb-8 transition-all duration-1000"
                    style={{ opacity: isReady ? 1 : 0, transform: isReady ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)' }}
                >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(45,106,79,0.15) 0%, transparent 70%)', transform: 'scale(1.6)' }} />
                    {/* Inner ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#2D6A4F]/10 scale-110" />
                    <div className="w-44 h-44 md:w-56 md:h-56 relative z-10 drop-shadow-2xl">
                        <img
                            src="/branding/afia_logo.png"
                            alt="SoftyCode Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Brand Name Block */}
                <div
                    className="text-center transition-all duration-1000 delay-200"
                    style={{ opacity: isReady ? 1 : 0, transform: isReady ? 'translateY(0)' : 'translateY(24px)' }}
                >
                    {/* Arabic primary name */}
                    <div className="mb-1" dir="rtl">
                        <span
                            className="font-black tracking-tight leading-none block"
                            style={{
                                fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
                                background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #52B788 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                filter: 'drop-shadow(0 2px 8px rgba(45,106,79,0.25))',
                            }}
                        >
                            سوفتي كود
                        </span>
                    </div>

                    {/* Divider with icon */}
                    <div className="flex items-center justify-center gap-3 my-3">
                        <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to left, transparent, #2D6A4F40)' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F8961E]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F8961E]" />
                        <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to right, transparent, #2D6A4F40)' }} />
                    </div>

                    {/* Arabic subtitle */}
                    <div className="mb-4" dir="rtl">
                        <span
                            className="font-bold tracking-wide"
                            style={{
                                fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)',
                                color: '#F8961E',
                                textShadow: '0 1px 12px rgba(248,150,30,0.25)',
                            }}
                        >
                            للمطاعم و الكفيهات
                        </span>
                    </div>

                    {/* English name badge */}
                    <div
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
                        style={{
                            background: 'rgba(45,106,79,0.07)',
                            border: '1px solid rgba(45,106,79,0.15)',
                        }}
                    >
                        <span
                            className="font-black uppercase tracking-[0.25em] text-xs"
                            style={{ color: '#2D6A4F', opacity: 0.75 }}
                        >
                            SOFTYCODE
                        </span>
                        <div className="w-px h-3 bg-[#2D6A4F]/20" />
                        <span
                            className="font-bold tracking-widest text-[10px] uppercase"
                            style={{ color: '#2D6A4F', opacity: 0.5 }}
                        >
                            Restaurants & Cafes
                        </span>
                    </div>
                </div>

                {/* Progress section */}
                <div
                    className="mt-14 flex flex-col items-center gap-3 transition-all duration-1000 delay-500"
                    style={{ opacity: isReady ? 1 : 0, transform: isReady ? 'translateY(0)' : 'translateY(16px)' }}
                >
                    {/* Progress bar */}
                    <div className="w-64 md:w-80 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(45,106,79,0.1)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #2D6A4F 0%, #52B788 60%, #F8961E 100%)',
                                boxShadow: '0 0 10px rgba(45,106,79,0.4)',
                            }}
                        />
                    </div>

                    <p className="text-xs font-bold tracking-[0.3em] uppercase animate-pulse" style={{ color: '#2D6A4F', opacity: 0.5 }}>
                        جاري التحميل...
                    </p>
                </div>
            </div>

            {/* Bottom badge */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.35em]" style={{ color: '#2D6A4F', opacity: 0.3 }}>
                    DIGITAL POS SYSTEM · v2.0
                </span>
            </div>
        </div>
    );
};

export default SplashScreen;
