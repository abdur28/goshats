/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006B3F",
          50: "#E6F5EE",
          100: "#CCE9DD",
          200: "#99D3BB",
          300: "#66BE99",
          400: "#33A877",
          500: "#006B3F",
          600: "#005632",
          700: "#004026",
          800: "#002B19",
          900: "#00150D",
        },
        accent: {
          DEFAULT: "#DAA520",
          50: "#FBF3DC",
          100: "#F7E7B9",
          200: "#EFCF73",
          300: "#E7B72D",
          400: "#DAA520",
          500: "#B8891A",
          600: "#966E15",
          700: "#745410",
          800: "#52390B",
          900: "#301F06",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        dark: {
          DEFAULT: "#1A1A2E",
          100: "#16213E",
          200: "#0F3460",
        },
        light: {
          DEFAULT: "#F8F9FA",
          100: "#E9ECEF",
          200: "#DEE2E6",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
};
