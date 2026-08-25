import Image from "next/image";

/**
 * Multi-tenant, so there's no single fixed brand mark: an organization
 * with `logo_url` set (Settings > Branding) shows that; everyone else
 * gets a generic lock-in-a-box mark tinted with the org's own accent
 * color, which still reads fine for Accurate Storage itself (the pilot
 * organization) without a real uploaded logo.
 */
export function Logo({ size = 36, logoUrl, name }: { size?: number; logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        priority
        unoptimized
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-pink text-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </div>
  );
}
