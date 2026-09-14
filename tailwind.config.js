/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Official Magic Survival font (magicSurvival.ttf), loaded via @font-face in index.css.
        magic: ["MagicSurvival", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Dark gothic/retro game shell.
        ink: {
          950: "#0a0a0c",
          900: "#141416",
          800: "#1d1d1f",
          700: "#2a2a2d",
          600: "#3a3a3e",
        },
        // Border/accent colors lifted directly from the reference repo's builder.css
        // rarity classes (.gray-border/.blue-border/.purple-border/.red-border/.yellow-border).
        rarity: {
          common: "rgb(121, 119, 120)",
          rare: "rgb(47, 77, 97)",
          epic: "rgb(82, 40, 90)",
          special: "rgb(107, 25, 34)",
          legendary: "rgb(161, 163, 51)",
        },
        gold: "rgb(238, 204, 24)",
        ember: "rgb(234, 105, 6)",
        alert: {
          watch: "rgb(110, 217, 74)",
          warning: "rgb(240, 160, 40)",
          critical: "rgb(224, 90, 60)",
        },
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.5)",
        glow: "0 0 0 2px rgb(238, 204, 24), 0 0 16px rgba(238, 204, 24, 0.5)",
      },
    },
  },
  plugins: [],
};
