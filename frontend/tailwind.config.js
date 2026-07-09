/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      /* ── Colors (CSS variable bridge) ── */
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground, 1 0 0) / <alpha-value>)",
        },
        border: "oklch(var(--border) / <alpha-value>)",
        input:  "oklch(var(--input)  / <alpha-value>)",
        ring:   "oklch(var(--ring)   / <alpha-value>)",
        chart: {
          1: "oklch(var(--chart-1) / <alpha-value>)",
          2: "oklch(var(--chart-2) / <alpha-value>)",
          3: "oklch(var(--chart-3) / <alpha-value>)",
          4: "oklch(var(--chart-4) / <alpha-value>)",
          5: "oklch(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT:              "oklch(var(--sidebar)                    / <alpha-value>)",
          foreground:           "oklch(var(--sidebar-foreground)         / <alpha-value>)",
          primary:              "oklch(var(--sidebar-primary)            / <alpha-value>)",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent:               "oklch(var(--sidebar-accent)             / <alpha-value>)",
          "accent-foreground":  "oklch(var(--sidebar-accent-foreground)  / <alpha-value>)",
          border:               "oklch(var(--sidebar-border)             / <alpha-value>)",
          ring:                 "oklch(var(--sidebar-ring)               / <alpha-value>)",
        },
      },

      /* ── Border Radius (iOS scale) ── */
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        DEFAULT: "var(--radius)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        "4xl": "3rem",
        "5xl": "4rem",
      },

      /* ── Typography ── */
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading, var(--font-sans))", "system-ui", "sans-serif"],
      },

      /* ── Box Shadows ── */
      boxShadow: {
        // Glass / iOS-style
        glass:      "0 8px 32px oklch(0.13 0.01 260 / 0.10), 0 2px 8px oklch(0.13 0.01 260 / 0.06)",
        "glass-sm": "0 4px 16px oklch(0.13 0.01 260 / 0.08), 0 1px 4px oklch(0.13 0.01 260 / 0.05)",
        float:      "0 20px 60px oklch(0.13 0.01 260 / 0.14), 0 4px 16px oklch(0.13 0.01 260 / 0.08)",
        "float-sm": "0 10px 30px oklch(0.13 0.01 260 / 0.10), 0 2px 8px oklch(0.13 0.01 260 / 0.06)",
        // Glow
        "glow-blue": "0 0 20px oklch(0.545 0.22 264 / 0.25), 0 0 8px oklch(0.545 0.22 264 / 0.15)",
        "glow-blue-sm": "0 0 8px oklch(0.545 0.22 264 / 0.20)",
        "glow-indigo": "0 0 20px oklch(0.50 0.20 280 / 0.25), 0 0 8px oklch(0.50 0.20 280 / 0.15)",
        // Inset glass border
        "inset-glass": "inset 0 1px 0 oklch(1 0 0 / 0.45), inset 0 -1px 0 oklch(0.88 0.005 247 / 0.30)",
        // Elevated card
        card:    "0 4px 24px oklch(0.13 0.01 260 / 0.08), 0 1px 6px oklch(0.13 0.01 260 / 0.05)",
        "card-hover": "0 8px 40px oklch(0.13 0.01 260 / 0.12), 0 2px 10px oklch(0.13 0.01 260 / 0.07)",
      },

      /* ── Backdrop Blur ── */
      backdropBlur: {
        xs:   "4px",
        sm:   "8px",
        DEFAULT: "12px",
        md:   "16px",
        lg:   "20px",
        xl:   "24px",
        "2xl": "32px",
        "3xl": "48px",
      },

      /* ── Keyframes ── */
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "spring-in": {
          "0%":   { opacity: "0", transform: "scale(0.88)" },
          "60%":  { opacity: "1", transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px oklch(0.545 0.22 264 / 0.20)" },
          "50%":       { boxShadow: "0 0 20px oklch(0.545 0.22 264 / 0.25), 0 0 8px oklch(0.545 0.22 264 / 0.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":       { transform: "translate(30px, -20px) scale(1.05)" },
          "66%":       { transform: "translate(-20px, 15px) scale(0.97)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },

      /* ── Animations ── */
      animation: {
        // Page transitions
        "fade-up":   "fade-up 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) both",
        "fade-in":   "fade-in 0.3s ease both",
        "scale-in":  "scale-in 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) both",
        "spring-in": "spring-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",

        // Slide
        "slide-in-left":  "slide-in-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",

        // Looping
        shimmer:    "shimmer 1.6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        float:       "float 4s ease-in-out infinite",
        "blob-drift": "blob-drift 12s ease-in-out infinite",
        spin:         "spin 0.75s linear infinite",
      },

      /* ── Transition Timing Functions ── */
      transitionTimingFunction: {
        spring:        "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-soft": "cubic-bezier(0.34, 1.2,  0.64, 1)",
        ios:           "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        bounce:        "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
}
