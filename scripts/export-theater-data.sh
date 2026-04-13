#!/bin/bash
# ============================================================
# export-theater-data.sh
# Tenant-granularer DB-Export pro Theater
# ============================================================
# Verwendung:
#   ./scripts/export-theater-data.sh <theater_id>        # Einzelnes Theater
#   ./scripts/export-theater-data.sh --all               # Alle Theater
#
# Voraussetzungen:
#   - psql installiert
#   - DATABASE_URL in .env.local oder als Umgebungsvariable gesetzt
#   - Format: postgresql://user:password@host:port/dbname
#
# Outputs: ./backups/theater-<id>-<datum>.sql
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$REPO_ROOT/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# .env.local laden falls vorhanden
if [ -f "$REPO_ROOT/.env.local" ]; then
  export $(grep -E '^(DATABASE_URL|SUPABASE_DB_URL)' "$REPO_ROOT/.env.local" | xargs)
fi

DB_URL="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL oder SUPABASE_DB_URL nicht gesetzt."
  echo "Tipp: Supabase DB-URL findest du im Dashboard unter Settings → Database → Connection string"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

export_theater() {
  local THEATER_ID="$1"
  local OUTFILE="$BACKUP_DIR/theater-${THEATER_ID}-${DATE}.sql"

  echo "→ Exportiere Theater $THEATER_ID nach $OUTFILE ..."

  psql "$DB_URL" -c "\COPY (
    SELECT 'costumes' AS tbl, row_to_json(c.*) AS data
    FROM costumes c WHERE c.theater_id = '${THEATER_ID}'
    UNION ALL
    SELECT 'collections', row_to_json(col.*)
    FROM collections col WHERE col.theater_id = '${THEATER_ID}'
    UNION ALL
    SELECT 'theater_members', row_to_json(tm.*)
    FROM theater_members tm WHERE tm.theater_id = '${THEATER_ID}'
    UNION ALL
    SELECT 'theater_network_members', row_to_json(tnm.*)
    FROM theater_network_members tnm WHERE tnm.theater_id = '${THEATER_ID}'
    UNION ALL
    SELECT 'costume_network_visibility', row_to_json(cnv.*)
    FROM costume_network_visibility cnv
    JOIN costumes c2 ON c2.id = cnv.costume_id
    WHERE c2.theater_id = '${THEATER_ID}'
  ) TO '$OUTFILE' (FORMAT text)"

  echo "✓ Export abgeschlossen: $OUTFILE"
}

if [ "${1:-}" = "--all" ]; then
  echo "→ Exportiere alle Theater ..."
  THEATER_IDS=$(psql "$DB_URL" -t -A -c "SELECT id FROM theaters ORDER BY created_at;")
  for ID in $THEATER_IDS; do
    export_theater "$ID"
  done
  echo "✓ Alle Theater exportiert nach $BACKUP_DIR"
elif [ -n "${1:-}" ]; then
  export_theater "$1"
else
  echo "Verwendung:"
  echo "  $0 <theater_id>    # Einzelnes Theater exportieren"
  echo "  $0 --all           # Alle Theater exportieren"
  exit 1
fi
