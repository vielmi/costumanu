"use client";

import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--page-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        fontFamily: "var(--font-family-base)",
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-200)",
          color: "var(--neutral-grey-600)",
          padding: 0,
        }}
      >
        ← Zurück
      </button>

      <h1
        style={{
          fontSize: "var(--font-size-1000)",
          fontWeight: 300,
          color: "var(--secondary-900)",
          margin: "0 0 24px",
          lineHeight: 1.2,
        }}
      >
        Vorhang noch zu
      </h1>
      <p
        style={{
          fontSize: "var(--font-size-300)",
          color: "var(--neutral-grey-500)",
          margin: "0 0 32px",
        }}
      >
        Der Support-Bereich ist noch in Arbeit.
        <br />
        Bis dahin erreichst du uns direkt per E-Mail.
      </p>
      <a
        href="mailto:support@palcopiu.com"
        style={{
          fontSize: "var(--font-size-350)",
          fontWeight: "var(--font-weight-500)",
          color: "var(--primary-900)",
          textDecoration: "none",
          borderBottom: "1px solid var(--primary-900)",
          paddingBottom: 2,
        }}
      >
        support@palcopiu.com
      </a>
    </main>
  );
}
