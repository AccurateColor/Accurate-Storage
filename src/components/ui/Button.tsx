import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-pink text-white hover:bg-pink-dark",
  secondary: "border border-line bg-surface text-ink hover:bg-paper",
  danger: "bg-red text-white hover:opacity-90",
  success: "bg-green text-white hover:opacity-90",
  ghost: "text-ink-muted hover:bg-paper",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
