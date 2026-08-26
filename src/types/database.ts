// Hand-written to match supabase/schema.sql exactly.
// Once the `supabase` CLI is linked to the project, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// and re-apply the small ergonomic aliases at the bottom of this file.
//
// Every table carries an empty `Relationships: []` — @supabase/postgrest-js's
// generic helpers require that shape to infer Insert/Update payload types
// correctly; omitting it silently collapses those to `never`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "trial" | "active" | "canceled";
          trial_ends_at: string;
          primary_color: string;
          accent_color: string;
          logo_url: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          stripe_secret_key: string | null;
          stripe_publishable_key: string | null;
          public_availability_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: "trial" | "active" | "canceled";
          trial_ends_at?: string;
          primary_color?: string;
          accent_color?: string;
          logo_url?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          stripe_secret_key?: string | null;
          stripe_publishable_key?: string | null;
          public_availability_enabled?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      team: {
        Row: {
          id: string;
          organization_id: string;
          auth_user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          auth_user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team"]["Insert"]>;
        Relationships: [];
      };
      team_permissions: {
        Row: {
          id: string;
          team_id: string;
          permission_key: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          permission_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_permissions"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          organization_id: string;
          unit_number: string;
          size: string | null;
          square_footage: number | null;
          monthly_rate: number;
          status: "vacant" | "occupied" | "reserved" | "maintenance";
          stripe_price_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          unit_number: string;
          size?: string | null;
          square_footage?: number | null;
          monthly_rate?: number;
          status?: "vacant" | "occupied" | "reserved" | "maintenance";
          stripe_price_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          status: "lead" | "active" | "past" | "delinquent";
          unit_id: string | null;
          lease_start: string | null;
          lease_end: string | null;
          source: string | null;
          notes: string | null;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          vehicle_info: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          intake_details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          status?: "lead" | "active" | "past" | "delinquent";
          unit_id?: string | null;
          lease_start?: string | null;
          lease_end?: string | null;
          source?: string | null;
          notes?: string | null;
          address_line1?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          vehicle_info?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          intake_details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          tenant_id: string;
          unit_id: string | null;
          amount: number;
          due_date: string;
          paid_date: string | null;
          status: "paid" | "due" | "late";
          method: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tenant_id: string;
          unit_id?: string | null;
          amount: number;
          due_date: string;
          paid_date?: string | null;
          status?: "paid" | "due" | "late";
          method?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      gate_codes: {
        Row: {
          id: string;
          organization_id: string;
          label: string;
          tenant_id: string | null;
          unit_id: string | null;
          code: string;
          vehicle_plate: string | null;
          access_level: "tenant" | "staff" | "visitor" | "vendor";
          active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          label: string;
          tenant_id?: string | null;
          unit_id?: string | null;
          code: string;
          vehicle_plate?: string | null;
          access_level?: "tenant" | "staff" | "visitor" | "vendor";
          active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gate_codes"]["Insert"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          message: string;
          tenant_id: string | null;
          unit_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          message: string;
          tenant_id?: string | null;
          unit_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ---- Ergonomic row-type aliases ----
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Team = Database["public"]["Tables"]["team"]["Row"];
export type TeamPermissionRow = Database["public"]["Tables"]["team_permissions"]["Row"];
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type GateCode = Database["public"]["Tables"]["gate_codes"]["Row"];
export type ActivityLogEntry = Database["public"]["Tables"]["activity_log"]["Row"];

// ---- Permissions ----
// Mirrors supabase/policies.sql's has_permission() checks exactly — a key
// added here with no matching policy silently grants nothing; a policy
// added there with no matching key here has no UI to assign it.
export const PERMISSION_KEYS = [
  "admin",
  "view_units",
  "edit_units",
  "view_tenants",
  "edit_tenants",
  "view_payments",
  "edit_payments",
  "view_delinquency",
  "view_gate_access",
  "edit_gate_access",
  "view_settings",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  admin: "Admin (full access)",
  view_units: "View Units",
  edit_units: "Edit Units",
  view_tenants: "View Leads & Tenants",
  edit_tenants: "Edit Leads & Tenants",
  view_payments: "View Payments & Billing",
  edit_payments: "Edit Payments & Billing",
  view_delinquency: "View Delinquency",
  view_gate_access: "View Gate Access",
  edit_gate_access: "Edit Gate Access",
  view_settings: "View Settings",
};

// Granted to every team member created via the standard "Add Team Member"
// flow when no specific role is picked yet — matches the design handoff's
// modal, which only collects email + a role dropdown (default "Admin") in
// v1; a finer per-permission picker can replace this later without a
// schema change.
export const DEFAULT_STAFF_PERMISSIONS: PermissionKey[] = [
  "view_units",
  "view_tenants",
  "edit_tenants",
  "view_payments",
  "edit_payments",
  "view_delinquency",
  "view_gate_access",
  "edit_gate_access",
];
