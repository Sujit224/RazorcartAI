/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        myntra: {
          pink: "#ff3f6c",
          pinkHover: "#e62e5b",
          orange: "#f26a10",
          yellow: "#ff905a",
          dark: "#282c3f",
          charcoal: "#535766",
          lightGray: "#f5f5f6",
          border: "#eaeaec",
          ratingGreen: "#14958f",
          emerald: "#03a685"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'myntra-card': '0 2px 16px 0 rgba(0, 0, 0, 0.08)',
        'myntra-hover': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'agent-glow': '0 0 25px rgba(255, 63, 108, 0.25)'
      }
    },
  },
  plugins: [],
}
