import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Gill Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Gatsby FLF', 'serif'],
      },
      colors: {
        'brand-primary': '#a37529',
        'brand-secondary': '#e4bf6e',
        'brand-black': '#0a0a0a',
        'brand-black-secondary': '#171717',
        'brand-brown': '#231f20',
        'brand-gold': '#e4bf6e',
        'brand-brown-hover': '#3a3536',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      borderRadius: {
        lg: '0',
        md: '0',
        sm: '0',
        DEFAULT: '0',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-200%)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateX(200%)', opacity: '0' },
        },
        'spin-bounce': {
          '0%': { transform: 'rotate(0deg)' },
          '60%': { transform: 'rotate(390deg)' },
          '80%': { transform: 'rotate(350deg)' },
          '90%': { transform: 'rotate(365deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'in': 'in 0.2s ease-out',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'spin-bounce': 'spin-bounce 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
