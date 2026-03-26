/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Bluesky ALF contrast scale (light mode values; dark mode uses Tailwind dark: with inverted mapping)
        contrast: {
          0: '#FFFFFF',
          25: '#F9FAFB',
          50: '#EFF2F6',
          100: '#DCE2EA',
          200: '#C0CAD8',
          300: '#A5B2C5',
          400: '#8798B0',
          500: '#667B99',
          600: '#526580',
          700: '#405168',
          800: '#313F54',
          900: '#232E3E',
          950: '#19222E',
          975: '#111822',
          1000: '#000000',
        },
        // Bluesky ALF primary scale
        primary: {
          25: '#F5F9FF',
          50: '#E5F0FF',
          100: '#CCE1FF',
          200: '#A8CCFF',
          300: '#75AFFF',
          400: '#4291FF',
          500: '#006AFF',
          600: '#0059D6',
          700: '#0048AD',
          800: '#00398A',
          900: '#002861',
          950: '#001E47',
          975: '#001533',
        },
        // Bluesky ALF negative (error/danger) scale
        negative: {
          25: '#FFF5F7',
          50: '#FEE7EC',
          100: '#FDD3DD',
          200: '#FBBBCA',
          300: '#F891A9',
          400: '#F65A7F',
          500: '#E91646',
          600: '#CA123D',
          700: '#A71134',
          800: '#7F0B26',
          900: '#5F071C',
          950: '#430413',
          975: '#30030D',
        },
        // Bluesky ALF positive (success) scale
        positive: {
          25: '#ECFEF5',
          50: '#D3FDE8',
          100: '#A3FACF',
          200: '#6AF6B0',
          300: '#2CF28F',
          400: '#0DD370',
          500: '#09B35E',
          600: '#04904A',
          700: '#036D38',
          800: '#04522B',
          900: '#033F21',
          950: '#032A17',
          975: '#021D0F',
        },
      },
      maxWidth: {
        content: '40rem',
      },
    },
  },
  plugins: [],
}
