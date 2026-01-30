import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-bg': '#F8FAFC',
        'card-bg': '#FFFFFF',
        'primary': '#4F46E5',
        'heading': '#0F172A',
        'body-text': '#475569',
        'accent': '#06B6D4',
        'intelligence-bg': '#F0F4FF',
        'clean-canvas-bg': '#F8FAFC',
        'deep-academic-bg': '#0F172A',
        'deep-academic-text': '#CBD5E1',
        'intel-accent': '#06B6D4',
        /* Purple theme tokens */
        'midnight-nebula': '#121019',
        'purple-primary': '#6D28D9',
        'amethyst-top': '#1E1B4B',
        'amethyst-bottom': '#3B0764',
        'lavender-dark': '#1E1B24',
      },
      backgroundImage: {
        'amethyst-gradient': 'linear-gradient(135deg, #1E1B4B 0%, #3B0764 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Merriweather', 'serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      ringColor: {
        primary: '#4F46E5',
      },
    },
  },
  plugins: [],
};
export default config;
