/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./index.tsx",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Cairo', 'sans-serif'],
            },
            colors: {
                brand: {
                    primary: '#2D6A4F',   // Dark Green
                    secondary: '#52B788', // Light Green
                    accent: '#F8961E',    // Orange
                    light: '#D8F3DC',     // Mint
                    cream: '#F8F9FA',     // Off-white/Cream
                    dark: '#1B4332',      // Deep Green
                },
                // ── Dark Mode Palette (Enterprise / Linear-grade) ──────────
                dm: {
                    base: '#0F1117', // Deepest background ─ page canvas
                    surface: '#161B22', // Cards / panels surface
                    overlay: '#1E2433', // Modals / elevated overlays
                    border: '#2D3448', // Subtle borders
                    muted: '#3A4257', // Disabled / muted backgrounds
                    text: {
                        primary: '#E8EAEE', // Main readable text
                        secondary: '#8B9BC0', // Labels, helpers
                        hint: '#525D77', // Placeholders, very muted
                    },
                    green: {
                        glow: '#40C980', // Bright accent line / icons
                        soft: '#1E3A2A', // Tag background / subtle fill
                        badge: '#1A4532', // Badge background
                    },
                    amber: '#FBBF24', // Warnings in dark mode
                    red: '#F87171', // Errors  
                },
                // ─────────────────────────────────────────────────────────
                green: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                },
                orange: {
                    500: '#f97316',
                    600: '#ea580c',
                }
            }
        },
    },
    plugins: [],
}
