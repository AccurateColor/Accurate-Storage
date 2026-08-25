"use client";

import { useActionState } from "react";
import { signup, type SignupState } from "./actions";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: SignupState = { error: null };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="organizationName">Facility name</Label>
        <Input id="organizationName" name="organizationName" type="text" placeholder="Accurate Storage" required />
      </div>
      <div>
        <Label htmlFor="adminName">Your name</Label>
        <Input id="adminName" name="adminName" type="text" placeholder="Jane Doe" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="text-sm text-red">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating your account…" : "Start my free trial"}
      </Button>
      <p className="text-center text-[11px] text-ink-muted">
        14 days free, no credit card required.
      </p>
    </form>
  );
}
