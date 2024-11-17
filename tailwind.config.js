import typo from "@tailwindcss/typography";
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "components/**/*.{js,jsx}",
    "content/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [typo],
};
