import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1120px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        warm: {
          DEFAULT: "hsl(var(--warm))",
          foreground: "hsl(var(--warm-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        surface: {
          paper: "hsl(var(--surface-paper))",
          deep: "hsl(var(--surface-paper-deep))",
          highlight: "hsl(var(--surface-highlight))",
          sky: "hsl(var(--surface-sky))",
          coral: "hsl(var(--surface-coral))"
        },
        ink: {
          DEFAULT: "hsl(var(--text-primary))",
          muted: "hsl(var(--text-muted))"
        },
        party: {
          blue: "hsl(var(--accent-blue))",
          "blue-deep": "hsl(var(--accent-blue-deep))",
          yellow: "hsl(var(--accent-yellow))",
          orange: "hsl(var(--accent-orange))",
          red: "hsl(var(--accent-red))",
          pink: "hsl(var(--accent-pink))",
          green: "hsl(var(--accent-green))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)"
      },
      boxShadow: {
        paper: "0 18px 45px -26px hsl(var(--shadow-warm) / 0.65)",
        lift: "0 12px 28px -18px hsl(var(--shadow-warm) / 0.55)",
        sticker:
          "0 8px 0 hsl(var(--accent-blue-deep) / 0.26), 0 20px 42px -28px hsl(var(--shadow-warm) / 0.72)",
        outline: "6px 6px 0 hsl(var(--border-strong) / 0.12)"
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        medium: "var(--motion-medium)",
        slow: "var(--motion-slow)"
      },
      transitionTimingFunction: {
        paper: "var(--ease-paper)",
        "bounce-soft": "var(--ease-bounce-soft)"
      }
    }
  },
  plugins: [animate]
};

export default config;
