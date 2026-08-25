"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationWithAdmin } from "@/lib/auth/account-provisioning";

export type SignupState = { error: string | null };

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!organizationName || !adminName || !email || !password) {
    return { error: "Fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const result = await createOrganizationWithAdmin({ organizationName, adminName, email, password });
  if (!result.ok) {
    return { error: result.error };
  }

  // The account was created (and confirmed) via the service_role admin
  // client, which holds no session — sign in for real now, as this user,
  // so the normal cookie-based server client picks it up from here on.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Account exists; just send them to log in manually rather than
    // failing the whole signup over what's likely a transient issue.
    redirect("/login");
  }

  redirect("/");
}
