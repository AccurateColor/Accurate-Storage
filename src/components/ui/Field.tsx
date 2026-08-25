import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";

const fieldClasses =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none disabled:bg-paper disabled:text-ink-muted";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={clsx(fieldClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={clsx(fieldClasses, className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={clsx(fieldClasses, className)} {...props} />
  )
);
Select.displayName = "Select";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-bold tracking-wide text-ink-muted uppercase"
    >
      {children}
    </label>
  );
}

export function FormRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("space-y-1", className)}>{children}</div>;
}
