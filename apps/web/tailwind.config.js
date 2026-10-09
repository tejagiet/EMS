/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          navy: "#1e3a8a",
          navyHover: "#172554",
          sky: "#0284c7",
          amber: "#f59e0b",
          dark: "#0f172a",
        },
      },
      borderRadius: {
        saas: "8px",
      },
    },
  },
  plugins: [],
};
