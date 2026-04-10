"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function ScopeToggle({ scope }: { scope: "own" | "network" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setScope(value: "own" | "network") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeStyle = {
    background: "var(--primary-900)",
    color: "#FFFFFF",
    fontWeight: "var(--font-weight-500)",
  };
  const inactiveStyle = {
    background: "transparent",
    color: "var(--primary-900)",
    fontWeight: "var(--font-weight-400)",
  };
  const base: React.CSSProperties = {
    height: 44,
    padding: "0 24px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--primary-900)",
    fontSize: "var(--font-size-300)",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
      <button
        type="button"
        onClick={() => setScope("own")}
        style={{ ...base, ...(scope === "own" ? activeStyle : inactiveStyle) }}
      >
        Mein Fundus
      </button>
      <button
        type="button"
        onClick={() => setScope("network")}
        style={{ ...base, ...(scope === "network" ? activeStyle : inactiveStyle) }}
      >
        Netzwerk
      </button>
    </div>
  );
}
