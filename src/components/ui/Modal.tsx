"use client";

import { ReactNode, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const sizeClass = { sm: "max-w-sm", md: "max-w-[450px]", lg: "max-w-2xl" }[size];

  // Every form modal in this app is one multi-field <form> with a single
  // explicit submit button in the footer — without this guard, the
  // browser's default behavior submits (and closes) the modal the moment
  // Enter is pressed in any plain text <input>. Textareas are left alone
  // (Enter there means "new line").
  function guardEnterSubmit(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "submit") {
      e.preventDefault();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={guardEnterSubmit}
        className={clsx(
          "flex max-h-[70vh] w-full flex-col rounded-xl bg-surface shadow-xl",
          sizeClass
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-ink-muted hover:bg-paper hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
