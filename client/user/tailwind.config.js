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
        "open-sans": ['"Open Sans"', "sans-serif"],
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
    themes: [
      {
        dark: {
          primary: "#bff367",
          "primary-focus": "#a2d152",
          secondary: "#55dee8",
          accent: "#bff367",
          neutral: "#1a1a1a",
          "base-100": "#000000",
          "base-200": "#121212",
          "base-300": "#1a1a1a",
          "base-content": "#ffffff",
          info: "#55dee8",
          success: "#00c187",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: "",
    logs: true,
  },
};
