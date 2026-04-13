#!/bin/bash
# ============================================================
# backup-storage.sh
# Supabase Storage Bucket Backup (Kostüm-Bilder)
# ============================================================
# Verwendet die Supabase CLI um alle Dateien aus dem
# costume-images Bucket lokal zu sichern.
#
# Verwendung:
#   ./scripts/backup-storage.sh
#
# Voraussetzungen:
#   - Supabase CLI installiert: https://supabase.com/docs/guides/cli
#   - SUPABASE_ACCESS_TOKEN in .env.local oder als Umgebungsvariable
#   - SUPABASE_PROJECT_ID in .env.local oder als Umgebungsvariable
#
# Outputs: ./backups/storage-<datum>/
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="$REPO_ROOT/backups/storage-${DATE}"

# .env.local laden falls vorhanden
if [ -f "$REPO_ROOT/.env.local" ]; then
  export $(grep -E '^(SUPABASE_ACCESS_TOKEN|SUPABASE_PROJECT_ID)' "$REPO_ROOT/.env.local" | xargs)
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN nicht gesetzt."
  echo "Tipp: Token erstellen unter https://supabase.com/dashboard/account/tokens"
  exit 1
fi

if [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
  echo "ERROR: SUPABASE_PROJECT_ID nicht gesetzt."
  echo "Tipp: Project ID findest du im Supabase Dashboard unter Settings → General"
  exit 1
fi

BUCKET="costume-images"

echo "→ Starte Storage-Backup für Bucket '$BUCKET' ..."
echo "→ Zielverzeichnis: $BACKUP_DIR"

mkdir -p "$BACKUP_DIR"

# Alle Dateien aus dem Bucket herunterladen
supabase storage cp \
  --experimental \
  --recursive \
  "ss://${BUCKET}" \
  "$BACKUP_DIR" \
  --project-ref "$SUPABASE_PROJECT_ID"

FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo "✓ Storage-Backup abgeschlossen"
echo "  Dateien: $FILE_COUNT"
echo "  Grösse:  $TOTAL_SIZE"
echo "  Pfad:    $BACKUP_DIR"

# Alte Backups aufräumen (älter als 30 Tage)
echo ""
echo "→ Bereinige Storage-Backups älter als 30 Tage ..."
find "$REPO_ROOT/backups" -maxdepth 1 -name "storage-*" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
echo "✓ Bereinigung abgeschlossen"
