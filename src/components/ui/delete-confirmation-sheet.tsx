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
        style={{ position: "fixed", inset: 0, zIndex: 2000, background: "var(--overlay-medium)" }}
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
            fontWeight: "var(--font-weight-700)",
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
          className="btn-danger"
          style={{ width: "100%", opacity: isDeleting ? 0.6 : 1 }}
        >
          {isDeleting ? "Wird gelöscht…" : "Endgültig löschen"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="btn-primary"
          style={{ width: "100%" }}
        >
          Abbrechen
        </button>
      </div>
    </>
  );
}
