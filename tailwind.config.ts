import type { Config } from "tailwindcss";

/**
 * Het palet komt uit het huisstijl-moodboard dat de klant zelf aanleverde
 * (`uploads/content/merk/huisstijl-moodboard.png`): salie-groen, off-white, blush en een
 * botanische lijn. Tot 27-08 stond hier cream met goud — een richting die vóór haar materiaal
 * gekozen was en die niet bij haar logo past: dat is olijfgroen met een gele boterbloem op
 * linnen, en daar hoort geen goud bij.
 *
 * De tokennamen zijn meeveranderd. Een token dat `gold` heet maar salie is, is een leugen die
 * de volgende wijziging duurder maakt.
 */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Off-white met een warme ondertoon — de achtergrond van vrijwel alles. */
        linen: "#F7F5F0",
        /** Een tint dieper dan linen, voor sectie-verlopen en tabelkoppen. */
        sand: "#EDE7DE",
        /** Warm grijs voor haarlijnen en randen. */
        mist: "#DCD6CB",
        sage: {
          /**
           * Het merkaccent. Haalt op wit 2,18:1 en op linen 2,00:1, dus **nooit voor tekst** —
           * alleen als vlak, met charcoal erop (6,66:1).
           */
          DEFAULT: "#A7B49A",
          light: "#C3CDB9",
          /** 3,00:1 op wit: randen, iconen, streepjes en koppen vanaf 24 px. Geen lopende tekst. */
          dark: "#8A9A7B",
          /**
           * Salie die gelezen mág worden: 5,49:1 op wit en 5,04:1 op linen, dus ruim boven de
           * AA-eis van 4,5:1. Gebruik hem waar de kleur betekenis draagt én de tekst gelezen
           * moet worden — een openstaand bedrag bijvoorbeeld.
           *
           * Dit is dezelfde afweging die eerder tot `gold-deep` leidde, met andere getallen.
           */
          deep: "#5F6E4E",
        },
        /**
         * Het olijfgroen van het woordmerk. Haalt op wit 4,56:1 maar op `linen` 4,18:1 — net
         * onder AA. Daarom uitsluitend voor het logo en grote koppen, niet voor lopende tekst.
         */
        olive: "#6E7B4E",
        blush: "#F5D9DE",
        /**
         * Het geel van de boterbloem in het logo. Neemt de rol over die `butter` had: "vraagt
         * aandacht". 1,68:1 op wit, dus altijd als vlak met charcoal erop (8,66:1).
         */
        boterbloem: "#F2C230",
        /**
         * Blijft staan, ook al zit hij niet in het moodboard: de rol "fout, gevaar, negatief"
         * heeft een rood nodig, en salie of geel kunnen dat niet dragen. Sluit bovendien aan
         * bij haar eigen bordeaux werk.
         */
        burgundy: "#7A1F2B",
        charcoal: "#2B2926",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ["Montserrat", "system-ui", "sans-serif"],
        /**
         * Geen schrijfletter meer. Het moodboard zet zijn accentregel ("Details maken het
         * verschil") in een cursieve serif, niet in een script-font; Allura is daarmee
         * vervallen en dat scheelt ook een lettertype om in te laden.
         */
        script: ['"Playfair Display"', "Georgia", "serif"],
      },
      backgroundImage: {
        "sage-shimmer":
          "linear-gradient(135deg, #A7B49A 0%, #C9D3C0 50%, #A7B49A 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
