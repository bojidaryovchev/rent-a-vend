"use client";

import { Toaster as HotToaster } from "react-hot-toast";

/**
 * Toasts, styled into the design system rather than left at library defaults.
 *
 * Square corners, hairline border, graphite ground - a toast that looks like a
 * bootstrap alert on a site made of steel panels is the kind of seam that makes
 * everything around it feel less considered.
 *
 * Positioned bottom-centre: top-right would collide with the sticky header, and
 * on a phone the header plus demo banner already own the top of the screen.
 */
export function Toaster() {
  return (
    <HotToaster
      position="bottom-center"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-graphite)",
          color: "var(--color-ink-inverse)",
          border: "1px solid var(--color-graphite-edge)",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.9375rem",
          padding: "12px 16px",
          maxWidth: "min(92vw, 30rem)",
          boxShadow: "0 14px 30px -22px oklch(0 0 0 / 0.9)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-accent)",
            secondary: "var(--color-graphite)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-danger)",
            secondary: "var(--color-ink-inverse)",
          },
        },
      }}
    />
  );
}
