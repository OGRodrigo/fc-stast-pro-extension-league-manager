/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      colors: {
        brand: {
          DEFAULT: "#16a34a",
          hover: "#15803d",
          muted: "#166534",
        },
      },
    },
  },
  plugins: [],
};
