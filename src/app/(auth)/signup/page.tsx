import { Logo } from "@/components/layout/Logo";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Logo size={32} name="Accurate Storage" />
          <div>
            <h1 className="text-lg font-bold text-ink">Accurate Storage</h1>
            <p className="text-xs text-ink-muted">All-in-One Facility Management</p>
          </div>
        </div>
        <SignupForm />
        <p className="mt-5 text-center text-xs text-ink-muted">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-navy underline">
            Sign in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
