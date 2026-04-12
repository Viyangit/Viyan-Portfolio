/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        foreground: "#f4f4f5",
        void: "#000000",
        navy: "#060a12",
        "navy-neon": "#0a1426",
        "navy-card": "#0c1628",
        mist: "#c8ced9",
        fog: "#8b93a3",
      },
      fontFamily: {
        display: ['"Orbitron"', "system-ui", "sans-serif"],
        body: ["Syne", "system-ui", "sans-serif"],
        sub: ["Michroma", "system-ui", "sans-serif"],
        dm: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem,8vw,6rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 255, 255, 0.08), 0 0 80px rgba(255, 255, 255, 0.04)",
        "glow-sm": "0 0 24px rgba(255, 255, 255, 0.1)",
        "glow-md": "0 0 48px rgba(255, 255, 255, 0.12)",
        "glow-lg": "0 0 100px rgba(255, 255, 255, 0.1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
