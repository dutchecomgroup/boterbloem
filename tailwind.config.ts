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
          /**
           * Goud dat je mág lezen. `gold-dark` haalt op wit 3,7:1 en zakt daarmee door de
           * WCAG-AA-eis van 4,5:1 voor gewone tekst; deze haalt 4,9:1. Gebruik hem waar goud
           * de betekenis draagt én de tekst gelezen moet worden -- een openstaand bedrag,
           * bijvoorbeeld. Voor koppen, randen en iconen blijft `gold-dark` prima.
           */
          deep: "#8A6E36",
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
