import Link from "next/link";
import { APP_NAME, APP_LOGO_LETTER } from "@/lib/constants/app";

export function AppLogo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{
        width: 38, height: 38, background: "#0D0D0D", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--font-family-base)", fontWeight: "var(--font-weight-700)", fontSize: "var(--font-size-350)", color: "#F5C842", lineHeight: 1 }}>{APP_LOGO_LETTER}</span>
      </div>
      {showText && (
        <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-350)", fontWeight: "var(--font-weight-700)", color: "var(--neutral-grey-700)", whiteSpace: "nowrap" }}>
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
