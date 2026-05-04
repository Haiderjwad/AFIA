import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * مثال على استخدام useTheme Hook في أي component
 */
const ThemeExampleComponent: React.FC = () => {
  const { isDarkMode, setIsDarkMode, toggleTheme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: isDarkMode ? 'var(--dm-surface)' : 'rgba(255,255,255,0.8)',
        color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332',
        transition: 'background-color 300ms, color 300ms'
      }}
      className="p-8 rounded-2xl"
    >
      <h2 className="text-2xl font-bold mb-4">مثال على استخدام Theme</h2>

      {/* عرض الـ Mode الحالي */}
      <p className="mb-4">
        الـ Theme الحالي: <strong>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</strong>
      </p>

      {/* زر تبديل الـ Theme */}
      <button
        onClick={toggleTheme}
        className="px-6 py-3 rounded-xl font-bold transition-all duration-300 mb-6"
        style={{
          backgroundColor: isDarkMode ? 'var(--dm-green-glow)' : '#2D6A4F',
          color: isDarkMode ? 'var(--dm-base)' : 'white'
        }}
      >
        تبديل الـ Theme
      </button>

      {/* زر لتعيين Dark Mode مباشرة */}
      <button
        onClick={() => setIsDarkMode(true)}
        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ml-2 mb-6 ${
          isDarkMode ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: isDarkMode ? 'var(--dm-muted)' : '#2D6A4F',
          color: isDarkMode ? 'var(--dm-text-2)' : 'white'
        }}
        disabled={isDarkMode}
      >
        تفعيل Dark Mode
      </button>

      {/* زر لتعيين Light Mode مباشرة */}
      <button
        onClick={() => setIsDarkMode(false)}
        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 mb-6 ${
          !isDarkMode ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: !isDarkMode ? '#F0F0F0' : 'var(--dm-muted)',
          color: !isDarkMode ? '#666' : 'var(--dm-text-2)'
        }}
        disabled={!isDarkMode}
      >
        تفعيل Light Mode
      </button>

      {/* عناصر ملونة توضح تغيير الألوان */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {/* عنصر أخضر */}
        <div
          className="p-4 rounded-lg text-center font-bold"
          style={{
            backgroundColor: isDarkMode ? '#1E2E26' : 'rgba(45,106,79,0.1)',
            color: isDarkMode ? '#40C980' : '#2D6A4F'
          }}
        >
          الأخضر الأساسي
        </div>

        {/* عنصر برتقالي */}
        <div
          className="p-4 rounded-lg text-center font-bold"
          style={{
            backgroundColor: 'rgba(248,150,30,0.1)',
            color: '#F8961E'
          }}
        >
          البرتقالي
        </div>

        {/* عنصر للنص الثانوي */}
        <div
          className="p-4 rounded-lg text-center font-bold"
          style={{
            backgroundColor: isDarkMode ? 'var(--dm-muted)' : 'rgba(139,155,192,0.1)',
            color: isDarkMode ? 'var(--dm-text-2)' : '#8B9BC0'
          }}
        >
          النص الثانوي
        </div>

        {/* عنصر للأخطاء */}
        <div
          className="p-4 rounded-lg text-center font-bold"
          style={{
            backgroundColor: isDarkMode ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.1)',
            color: '#F87171'
          }}
        >
          أحمر (أخطاء)
        </div>
      </div>

      {/* شرح الـ Variables */}
      <div className="mt-8 p-4 rounded-lg" style={{
        backgroundColor: isDarkMode ? 'var(--dm-overlay)' : 'rgba(45,106,79,0.05)',
        border: `1px solid ${isDarkMode ? 'var(--dm-border)' : 'rgba(45,106,79,0.1)'}`
      }}>
        <h3 className="font-bold mb-3">متغيرات الـ Dark Mode المتاحة:</h3>
        <pre style={{
          color: isDarkMode ? 'var(--dm-text-2)' : '#8B9BC0',
          fontSize: '12px',
          overflow: 'auto',
          padding: '8px'
        }}>
{`--dm-base: #0F1117 (الخلفية)
--dm-surface: #161B22 (البطاقات)
--dm-overlay: #1E2433 (الـ Modals)
--dm-border: #2D3448 (الحدود)
--dm-muted: #252B3B (معطل)
--dm-text-1: #E8EAEE (النص الأساسي)
--dm-text-2: #8B9BC0 (النص الثانوي)
--dm-text-3: #525D77 (النص الخافت)
--dm-green-glow: #40C980 (أخضر متوهج)
--dm-green-soft: #1E2E26 (أخضر ناعم)
--dm-amber: #FBBF24 (تحذيرات)
--dm-red: #F87171 (أخطاء)`}
        </pre>
      </div>
    </div>
  );
};

export default ThemeExampleComponent;

/**
 * نماذج لاستخدام Theme في مكونات مختلفة:
 */

// 1. مثال بسيط - زر ملون
export const SimpleColoredButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();
  return (
    <button
      style={{
        backgroundColor: isDarkMode ? 'var(--dm-green-glow)' : '#2D6A4F',
        color: isDarkMode ? 'var(--dm-base)' : 'white'
      }}
      className="px-4 py-2 rounded-lg font-bold transition-colors duration-300"
    >
      {children}
    </button>
  );
};

// 2. مثال - بطاقة ملونة
export const ThemedCard: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      style={{
        backgroundColor: isDarkMode ? 'var(--dm-surface)' : 'rgba(255,255,255,0.8)',
        borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(45,106,79,0.1)',
        color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332'
      }}
      className="p-6 rounded-2xl border transition-colors duration-300"
    >
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className={isDarkMode ? 'text-[var(--dm-text-2)]' : 'text-gray-600'}>{content}</p>
    </div>
  );
};

// 3. مثال - Input حقل
export const ThemedInput: React.FC<{ placeholder: string }> = ({ placeholder }) => {
  const { isDarkMode } = useTheme();
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all"
      style={{
        borderColor: isDarkMode ? 'var(--dm-border)' : 'rgba(45,106,79,0.1)',
        backgroundColor: isDarkMode ? 'var(--dm-overlay)' : 'rgba(45,106,79,0.06)',
        color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332'
      }}
    />
  );
};

/**
 * استخدام في JSX:
 * <ThemeExampleComponent />
 * <SimpleColoredButton>اضغط هنا</SimpleColoredButton>
 * <ThemedCard title="عنوان" content="محتوى" />
 * <ThemedInput placeholder="اكتب هنا" />
 */
