import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6EE",
        gold: {
          DEFAULT: "#C8A560",
          light: "#D9BE85",
          dark: "#A0813E",
        },
        butter: "#F5E6A8",
        blush: "#F4D9D0",
        burgundy: "#7A1F2B",
        charcoal: "#2B2926",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        script: ['"Allura"', '"Cormorant Garamond"', "cursive"],
      },
      backgroundImage: {
        "gold-shimmer":
          "linear-gradient(135deg, #C8A560 0%, #E8D096 50%, #C8A560 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
