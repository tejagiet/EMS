/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
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
