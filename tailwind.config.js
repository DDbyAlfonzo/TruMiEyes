/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        line: "var(--line)",
        muted: "var(--muted)",
        champagne: "var(--champagne)",
        "brand-red": "var(--brand-red)",
        "brand-red-soft": "var(--brand-red-soft)",
        trumi: {
          red: "#CF4040",
          dark: "#0F0F0F",
          light: "#F4F5F7",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Cormorant Garamond", "ui-serif", "Georgia"],
      },
    },
  },
  plugins: [],
};
