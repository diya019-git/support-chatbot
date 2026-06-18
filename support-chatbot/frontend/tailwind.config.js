/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#EEF2ED",
        surface: "#FFFFFF",
        ink: "#1A2421",
        muted: "#5E6E69",
        border: "#DCE4DC",
        primary: {
          DEFAULT: "#1F4D45",
          light: "#2F6B60",
          dark: "#163933",
        },
        accent: {
          DEFAULT: "#E2A33B",
          dark: "#C9872A",
        },
        category: {
          order: "#3B7DD8",
          refund: "#2FA66B",
          account: "#9B6BD9",
          technical: "#E0823C",
          general: "#6B7280",
          escalated: "#D9455A",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        panel: "0 12px 32px -16px rgba(26, 36, 33, 0.25)",
      },
    },
  },
  plugins: [],
};
