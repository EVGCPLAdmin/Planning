/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EBF5EB",
          100: "#C6E3C6",
          200: "#9FCF9F",
          300: "#72B872",
          400: "#4DA04D",
          500: "#2E6B2E",
          600: "#265826",
          700: "#1A3F1A",
          800: "#112A11",
          900: "#091509",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      }
    }
  },
  plugins: []
}
