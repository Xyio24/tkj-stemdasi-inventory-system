import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // ── Base ──
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5",
    "whitespace-nowrap select-none outline-none",
    "text-sm font-semibold",
    "border border-transparent bg-clip-padding",
    "transition-all duration-200 ease-spring",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:border-ring/60",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Haptic-like active press
    "active:scale-[0.95]",
  ].join(" "),
  {
    variants: {
      variant: {
        // ── Primary (iOS Blue) ──
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_1px_3px_oklch(0_0_0/0.15),inset_0_1px_0_oklch(1_0_0/0.15)]",
          "hover:brightness-110 hover:shadow-glow-blue-sm hover:scale-[1.02]",
          "active:brightness-95 active:shadow-none",
        ].join(" "),

        // ── Glass ──
        glass: [
          "glass text-foreground",
          "hover:bg-white/90 dark:hover:bg-white/10",
          "hover:scale-[1.02] hover:shadow-glass",
          "active:bg-white/70 dark:active:bg-white/5",
        ].join(" "),

        // ── Glass Primary (blue tinted glass) ──
        "glass-primary": [
          "bg-primary/10 dark:bg-primary/20",
          "border border-primary/20 dark:border-primary/30",
          "text-primary backdrop-blur-md",
          "hover:bg-primary/20 dark:hover:bg-primary/30",
          "hover:scale-[1.02] hover:border-primary/40",
          "hover:shadow-glow-blue-sm",
        ].join(" "),

        // ── Outline ──
        outline: [
          "border border-border bg-background text-foreground",
          "shadow-[0_1px_3px_oklch(0_0_0/0.06)]",
          "hover:bg-accent hover:border-border/80 hover:scale-[1.02]",
          "active:bg-accent/80",
        ].join(" "),

        // ── Secondary ──
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:scale-[1.02]",
          "active:bg-secondary/60",
        ].join(" "),

        // ── Ghost ──
        ghost: [
          "text-foreground bg-transparent",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/60",
        ].join(" "),

        // ── Destructive ──
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_1px_3px_oklch(0_0_0/0.15)]",
          "hover:bg-destructive/90 hover:scale-[1.02]",
          "active:bg-destructive/80 active:shadow-none",
        ].join(" "),

        // ── Link ──
        link: "text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-10 px-4 py-2 rounded-2xl",
        xs:      "h-6 px-2 text-xs rounded-xl gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-8 px-3 text-xs rounded-xl gap-1 [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-12 px-6 rounded-2xl text-base",
        xl:      "h-14 px-8 rounded-3xl text-base",
        icon:    "size-10 rounded-2xl",
        "icon-xs": "size-6 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-xl [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ── Spinner ──────────────────────────────────────────────────────────────────

function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants, ButtonSpinner }
