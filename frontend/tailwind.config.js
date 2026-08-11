/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        royalBlue: "#2F58CD",
        vividViolet: "#6C3483",
        slateBorder: "#E2E8F0",
        cyberDark: "#0B0F19",
        cyberCard: "#151D30",
        cyberBorder: "#22314D",
        cyberGreen: "#10B981",
        cyberRed: "#EF4444",
        cyberOrange: "#F59E0B",
      },
    },
  },
  plugins: [],
}
