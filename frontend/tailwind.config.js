/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme tokens (AntiYama: Charcoal + Vibrant Yellow)
        darkBg: '#0f0f12',
        darkSurface: '#18181b',
        darkCard: '#1f1f23',
        darkBorder: '#2e2e34',
        accentYellow: '#facc15',
        accentYellowHover: '#eab308',

        // Light theme tokens (Redflow: Crisp White + Bold Red)
        lightBg: '#f8fafc',
        lightSurface: '#ffffff',
        lightCard: '#ffffff',
        lightBorder: '#e2e8f0',
        accentRed: '#e11d48',
        accentRedHover: '#be123c',
      }
    },
  },
  plugins: [],
}
