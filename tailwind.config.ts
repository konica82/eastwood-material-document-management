import type { Config } from "tailwindcss";

/**
 * Tailwind utility classes → semantic design tokens (src/styles/tokens.css).
 *
 * Components reference these classes only — never raw values. Re-theming means
 * changing token values, not editing this file or any component.
 *
 * Loaded by Tailwind v4 via `@config "../../tailwind.config.ts"` in globals.css.
 * Content detection is automatic in v4, so no `content` array is needed.
 */
const config: Config = {
  theme: {
    extend: {
      colors: {
        // Backgrounds → bg-page / bg-surface / bg-subtle / bg-tooltip
        page: "var(--color-bg-page)",
        surface: "var(--color-bg-surface)",
        subtle: "var(--color-bg-subtle)",
        tooltip: "var(--color-bg-tooltip)",

        // Text → text-primary / text-secondary / text-tertiary / text-inverse
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
        inverse: "var(--color-text-inverse)",

        // Accent → text-accent / bg-accent / bg-accent-hover / bg-accent-subtle
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          subtle: "var(--color-accent-subtle)",
        },

        // Status → e.g. bg-success-subtle + text-success-strong for a badge
        success: {
          DEFAULT: "var(--color-success)",
          subtle: "var(--color-success-subtle)",
          strong: "var(--color-success-strong)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          subtle: "var(--color-warning-subtle)",
          strong: "var(--color-warning-strong)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          subtle: "var(--color-danger-subtle)",
          strong: "var(--color-danger-strong)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          subtle: "var(--color-info-subtle)",
          strong: "var(--color-info-strong)",
        },

        ring: "var(--color-ring)",
      },

      // Borders → border-default (and bare `border`) / border-strong
      borderColor: {
        DEFAULT: "var(--color-border)",
        default: "var(--color-border)",
        strong: "var(--color-border-strong)",
      },

      // Focus rings → ring-default
      ringColor: {
        DEFAULT: "var(--color-ring)",
        default: "var(--color-ring)",
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },

      // text-xs / sm / base / md / lg / xl / 2xl mapped to the design type scale
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        md: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
      },

      // rounded-sm / md / lg / full
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },

      // duration-fast / duration-normal and ease-out
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
    },
  },
};

export default config;
