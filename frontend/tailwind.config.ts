import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#112031',
        mist: '#e8f2ff',
        sand: '#f5e7c1',
        coral: '#ff7a59',
        mint: '#88d9c4',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 50px rgba(17, 32, 49, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
