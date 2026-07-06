/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12131a',
        panel: '#1b1d29',
        panel2: '#232538',
        line: '#2e3146',
        accent: '#5eead4',
        accent2: '#f472b6',
        muted: '#8b8fa8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(94,234,212,0.15), 0 8px 30px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
