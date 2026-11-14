import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          magenta: "hsl(var(--brand-magenta))",
          orange: "hsl(var(--brand-orange))",
          yellow: "hsl(var(--brand-yellow))",
        },
        sidebar: {
          foreground: "hsl(var(--sidebar-foreground))",
        },
        badge: {
          success: "hsl(var(--badge-success))",
          "success-bg": "hsl(var(--badge-success-bg))",
          pending: "hsl(var(--badge-pending))",
          "pending-bg": "hsl(var(--badge-pending-bg))",
          processing: "hsl(var(--badge-processing))",
          "processing-bg": "hsl(var(--badge-processing-bg))",
          error: "hsl(var(--badge-error))",
          "error-bg": "hsl(var(--badge-error-bg))",
          neutral: "hsl(var(--badge-neutral))",
          "neutral-bg": "hsl(var(--badge-neutral-bg))",
          brand: "hsl(var(--badge-brand))",
          "brand-bg": "hsl(var(--badge-brand-bg))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "var(--radius)", // 14px: cards, panels
        lg: "0.625rem", // 10px: inputs, buttons
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 2px hsl(267 10% 18% / 0.04), 0 4px 16px hsl(280 54% 36% / 0.06)",
        pop: "0 8px 32px hsl(280 54% 20% / 0.14)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
