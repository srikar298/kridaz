import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#55DEE8",
        "primary-focus": "#3cc5ce",
      },
      fontFamily: {
        sans: ['"Open Sans"', "sans-serif"],
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
