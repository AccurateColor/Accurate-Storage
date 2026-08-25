import { Suspense } from "react";
import { Logo } from "@/components/layout/Logo";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Logo size={32} name="Accurate Storage" />
          <div>
            <h1 className="text-lg font-bold text-ink">Accurate Storage</h1>
            <p className="text-xs text-ink-muted">Facility Management</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-5 text-center text-xs text-ink-muted">
          New facility?{" "}
          <a href="/signup" className="font-medium text-navy underline">
            Start your free trial
          </a>
          .
        </p>
      </div>
    </div>
  );
}
