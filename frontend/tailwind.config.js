/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: "class",   // Toggle dark mode via 'dark' class on <html>
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      animation: {
        "fade-in":       "fadeIn 0.3s ease forwards",
        "fade-in-up":    "fadeInUp 0.4s ease forwards",
        "slide-in-left": "slideInLeft 0.3s ease forwards",
        "scale-in":      "scaleIn 0.25s ease forwards",
        "pulse-glow":    "pulseGlow 2s ease-in-out infinite",
        shimmer:         "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeInUp:    { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideInLeft: { from: { opacity: 0, transform: "translateX(-16px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        scaleIn:     { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } },
        pulseGlow:   {
          "0%, 100%": { boxShadow: "0 0 12px rgba(99,102,241,0.3)" },
          "50%":      { boxShadow: "0 0 28px rgba(99,102,241,0.5)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
