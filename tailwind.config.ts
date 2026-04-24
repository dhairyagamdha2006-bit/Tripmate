import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        primary: '#0f766e',
        accent: '#0ea5e9',
        muted: '#e2e8f0',
        border: '#cbd5e1'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
