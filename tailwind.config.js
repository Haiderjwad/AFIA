/** @type {import('tailwindcss').Config} */
export default {
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
                    primary: '#2D6A4F', // Dark Green
                    secondary: '#52B788', // Light Green
                    accent: '#F8961E', // Orange
                    light: '#D8F3DC', // Mint
                    cream: '#F8F9FA', // Off-white/Cream
                    dark: '#1B4332', // Deep Green
                },
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
