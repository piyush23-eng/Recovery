/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAF8',
        card: '#FFFFFF',
        hairline: '#ECECE8',
        ink: {
          DEFAULT: '#0A0A0A',
          primary: '#0A0A0A',
          secondary: '#5A5A55',
          muted: '#8A8A85',
          subtle: '#B0B0AA',
        },
        accent: {
          blue: '#3B6FE0',
          blueLight: '#7BA0F2',
          blueSoft: '#EEF4FF',
          green: '#3FA85C',
          greenLight: '#7CD494',
          greenSoft: '#EDF8F1',
          amber: '#E8A23D',
          amberLight: '#FAD18C',
          amberSoft: '#FEF7EC',
          rose: '#E85D8A',
          roseLight: '#F7A3BE',
          roseSoft: '#FDF0F4',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '22px',
        '2card': '24px',
      },
      boxShadow: {
        subtle: '0 2px 16px rgba(0, 0, 0, 0.03)',
        card: '0 4px 20px rgba(0, 0, 0, 0.04)',
        tooltip: '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
