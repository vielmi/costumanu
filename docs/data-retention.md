# Datenaufbewahrungs-Fristen

> **Status: VORLAGE** — Fristen müssen mit Datenschutz-Verantwortlichem und ggf. Theater-Partnern festgelegt werden, bevor `run_dsgvo_cleanup()` produktiv läuft.
>
> **Zweck:** Definiert pro Datenkategorie, wie lange personenbezogene Daten gespeichert werden, und auf welcher Rechtsgrundlage. Wird vom DSGVO-Cleanup-Script und vom Deep-Review §5 geprüft.

## Datenkategorien

| Kategorie                   | Tabelle(n)               | Aufbewahrungsfrist | Rechtsgrundlage                  | Löschverhalten                       | Status    |
| --------------------------- | ------------------------ | ------------------ | -------------------------------- | ------------------------------------ | --------- |
| Aktive User-Accounts        | `auth.users`, `profiles` | _zu definieren_    | Art. 6 Abs. 1 lit. b DSGVO       | Manuelle Löschung auf Antrag         | offen     |
| Inaktive User-Accounts      | `auth.users`, `profiles` | _zu definieren_    | Art. 6 Abs. 1 lit. f DSGVO       | Auto-Löschung nach Inaktivitätsdauer | offen     |
| Einladungslinks             | `invitations`            | 7 Tage             | Verarbeitungszweck erfüllt       | `run_dsgvo_cleanup()`                | umgesetzt |
| Warenkorb-Inhalte (Cart)    | `carts`, `cart_items`    | _zu definieren_    | Verarbeitungszweck erfüllt       | `run_dsgvo_cleanup()`                | offen     |
| Inaktive Threads/Messages   | `threads`, `messages`    | _zu definieren_    | Verarbeitungszweck / berecht.    | `run_dsgvo_cleanup()`                | offen     |
| Audit-Log                   | `platform_audit_log`     | _zu definieren_    | Berechtigtes Interesse / Pflicht | Manuelles Pruning                    | offen     |
| Backup-Daten                | externe Backups          | 30 Tage            | Berechtigtes Interesse           | Auto-Bereinigung                     | umgesetzt |
| Kostüm-Bilder gelöschter K. | Storage Bucket           | _zu definieren_    | Verarbeitungszweck erfüllt       | _Cleanup-Logik fehlt aktuell_        | offen     |

## Prozess

1. Fristen mit Datenschutz-Verantwortlichem (intern oder extern) abstimmen.
2. Werte in dieser Datei eintragen.
3. `run_dsgvo_cleanup()` so anpassen, dass es die Fristen aus dieser Datei (oder einer abgeleiteten Konfiguration) liest.
4. Im Deep-Review §5 wird geprüft, ob:
   - jede Kategorie eine definierte Frist hat (kein „zu definieren" mehr),
   - das Cleanup-Script alle Kategorien abdeckt,
   - keine Datenkategorie unbegrenzt aufbewahrt wird ohne Begründung.

## Betroffenenrechte

- **Auskunft (Art. 15)**: technisch über `delete_user_data()`-Logik (Lese-Variante) abbildbar.
- **Löschung (Art. 17)**: implementiert via `delete_user_data()` + Admin-API-Aufruf für `auth.users`.
- **Datenportabilität (Art. 20)**: Exportformat _zu definieren_ (JSON / CSV).

## Verweise

- Skript: `scripts/run-dsgvo-cleanup.sql` bzw. Edge Function (siehe `runbooks/recurring-tasks.md`)
- Risiko-Tracking: `architecture-risks.md` Eintrag „Keine Aufbewahrungsfristen für Personendaten definiert"
- Review: `.claude/agents/review-deep.md` §5 Datenschutz
