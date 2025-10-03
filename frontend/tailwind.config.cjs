const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../stitch_ui/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#18a2aa',
        amber: {
          500: '#f59e0b',
          600: '#ffb703',
        },
        'background-light': '#f6f8f8',
        'background-dark': '#112021',
        'teal-900': '#0D4D44',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Newsreader"', 'serif'],
        sans: ['"Noto Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        glow: '0 0 60px rgba(24, 162, 170, 0.25)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    plugin(({ addVariant }) => {
      addVariant('supports-backdrop', '@supports (backdrop-filter: blur(0))');
    }),
  ],
};
