/**
 * Generates a unique barcode ID for costume items.
 * Format: KP-XXXXXXXX (8 random alphanumeric characters)
 */
export function generateBarcodeId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let result = "KP-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
