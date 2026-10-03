/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#001f12',
        secondary: '#ffffe4',
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        },
      }
    },
  },
  plugins: [],
}
