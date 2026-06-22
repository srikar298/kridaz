import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [require("@kridaz/ui/tailwind.preset.js")],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Satoshi"',
          '"General Sans"',
          '"Poppins"',
          "sans-serif",
        ],
      },
      backgroundImage: {
        banner: "url('/r.png')",
      },
      borderRadius: {
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: "",
    logs: true,
  },
};
