"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";

export type ActionState = { error: string | null };

function parsePaymentForm(formData: FormData) {
  const status = String(formData.get("status") ?? "due") as "paid" | "due" | "late";
  return {
    tenant_id: String(formData.get("tenant_id") ?? ""),
    unit_id: String(formData.get("unit_id") ?? "") || null,
    amount: Number(formData.get("amount") ?? 0),
    due_date: String(formData.get("due_date") ?? ""),
    status,
    paid_date: status === "paid" ? String(formData.get("paid_date") ?? "") || new Date().toISOString().slice(0, 10) : null,
    method: String(formData.get("method") ?? "").trim() || null,
  };
}

export async function createPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_payments")) return { error: "You don't have permission to record payments." };

  const fields = parsePaymentForm(formData);
  if (!fields.tenant_id) return { error: "Select a tenant." };
  if (!fields.due_date) return { error: "Due date is required." };
  if (!fields.amount || fields.amount <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({ organization_id: user.organization.id, ...fields });
  if (error) return { error: error.message };

  if (fields.status === "paid") {
    const { data: tenant } = await supabase.from("tenants").select("first_name, last_name").eq("id", fields.tenant_id).maybeSingle();
    await supabase.from("activity_log").insert({
      organization_id: user.organization.id,
      type: "payment_received",
      message: `Payment received: $${fields.amount.toFixed(2)}${tenant ? ` — ${tenant.first_name} ${tenant.last_name}` : ""}`,
      tenant_id: fields.tenant_id,
      unit_id: fields.unit_id,
    });
  }

  revalidatePath("/payments");
  revalidatePath("/delinquency");
  revalidatePath("/");
  return { error: null };
}

export async function markPaymentPaid(paymentId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_payments")) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", paymentId)
    .eq("organization_id", user.organization.id);
  if (!error) {
    revalidatePath("/payments");
    revalidatePath("/delinquency");
    revalidatePath("/");
  }
}

export async function deletePayment(paymentId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_payments")) return;

  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", paymentId).eq("organization_id", user.organization.id);
  revalidatePath("/payments");
  revalidatePath("/delinquency");
  revalidatePath("/");
}
