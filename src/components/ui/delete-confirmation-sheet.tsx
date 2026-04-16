"use client";

interface DeleteConfirmationSheetProps {
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Bottom-Sheet Modal für Lösch-Bestätigungen.
 * Einheitliches Design für alle Löschvorgänge in der App.
 */
export function DeleteConfirmationSheet({
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.4)" }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2001,
          background: "var(--neutral-white)",
          borderRadius: "24px 24px 0 0",
          padding: "28px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--neutral-grey-200)",
            alignSelf: "center",
            marginBottom: 8,
          }}
        />

        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-325)",
            fontWeight: 600,
            color: "var(--neutral-grey-600)",
            marginBottom: 4,
          }}
        >
          Kostüm löschen?
        </p>

        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--neutral-grey-400)",
            marginBottom: 8,
          }}
        >
          <strong style={{ color: "var(--neutral-grey-600)" }}>{itemName}</strong> wird
          unwiderruflich gelöscht und kann nicht wiederhergestellt werden.
        </p>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          style={{
            height: "var(--button-height-md)",
            borderRadius: "var(--radius-md)",
            background: "none",
            border: "1.5px solid var(--primary-900)",
            color: "var(--primary-900)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-250)",
            fontWeight: 600,
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.6 : 1,
          }}
        >
          {isDeleting ? "Wird gelöscht…" : "Endgültig löschen"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          style={{
            height: "var(--button-height-md)",
            borderRadius: "var(--radius-md)",
            background: "var(--secondary-900)",
            border: "none",
            color: "var(--neutral-white)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-250)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Abbrechen
        </button>
      </div>
    </>
  );
}
