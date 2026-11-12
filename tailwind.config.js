/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Studio (admin) dark surfaces
        background: "var(--background)",
        surface: "var(--surface)",
        line: "var(--line)",
        muted: "var(--muted)",
        champagne: "var(--champagne)",
        "brand-red": "var(--brand-red)",
        "brand-red-soft": "var(--brand-red-soft)",
        // Brand palette (Tru Mi Eyes logo sheet)
        trumi: {
          red: "#D22027",
          "red-deep": "#B51B21",
          ink: "#231F20",
          charcoal: "#393536",
          dark: "#231F20",
          light: "#F4F5F7",
        },
        // Client gallery (light) surfaces
        paper: "#FAFAF8",
        hairline: "#E7E5E0",
        stone: "#EDEBE6",
        "ink-soft": "#5F5E5A",
        label: {
          green: "#2F8F5B",
          amber: "#C9821F",
          blue: "#2F6FD0",
        },
      },
      fontFamily: {
        // Nunito Sans stands in for the logo's Avenir Next (licensed).
        sans: ["'Nunito Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Nunito Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.32em",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
