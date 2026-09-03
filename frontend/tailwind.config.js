/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0066cc",
          blueHover: "#0052a3",
          electric: "#0b72e7",
          navy: "#0c2340",
          navyLight: "#182c4f",
          slate: "#5c6f84",
          slateLight: "#94a3b8",
          emerald: "#00b386",
          emeraldHover: "#009973",
          emeraldLight: "#e6f7f3",
          ice: "#f0f7ff",
          iceDark: "#e2effa",
          border: "#e2e8f0",
          bg: "#f8fafc",
        },
        myntra: {
          pink: "#0066cc",
          pinkHover: "#0052a3",
          orange: "#0b72e7",
          yellow: "#00b386",
          dark: "#0c2340",
          charcoal: "#5c6f84",
          lightGray: "#f8fafc",
          border: "#e2e8f0",
          ratingGreen: "#00b386",
          emerald: "#00b386"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'brand-card': '0 2px 12px 0 rgba(12, 35, 64, 0.06)',
        'brand-hover': '0 8px 24px 0 rgba(12, 35, 64, 0.1)',
        'agent-glow': '0 0 25px rgba(0, 179, 134, 0.25)'
      }
    },
  },
  plugins: [],
}
