# kostüm+ — Architektur-Risiken & Mitigationen

| Priorität | Kategorie | Risiko | Mitigation | Verantwortlich | Zeitraum | Wiederholung | Hinweis | Status |
|---|---|---|---|---|---|---|---|---|
| Kritisch | Multi-Tenancy & Datenisolation | RLS-Fehler lassen Cross-Tenant-Datenzugriff zu | RLS-Policies mit `pg_tap` testen; `theater_id`-Denormalisierung dokumentieren; Staging mit mehreren Test-Theatern | Claude | Vor erstem Partner-Onboarding | Bei jeder neuen Migration | Jede neue Policy sofort testen | Offen |
| Kritisch | Sicherheit | Kompromittierter `platform_admin` hat Vollzugriff auf alle Tenants | `is_platform_admin` nur via DB-Eingriff setzen; 2FA erzwingen; Audit-Log implementiert (`20260410150000`) | Claude (Audit-Log) / Du (2FA, Anzahl Admins) | Erledigt (Audit-Log) / Du: jetzt (2FA) | — | Anzahl Platform Admins auf Minimum halten | Teilweise erledigt |
| Kritisch | DSGVO | Kein AVV mit Supabase — Betrieb formal rechtswidrig | AVV mit Supabase abschliessen (supabase.com/legal/dpa) | Du | Sobald erste echte Personen testen | — | Kostenlos, unabhängig vom Plan | Offen |
| Kritisch | DSGVO | Betroffenenrechte (Auskunft, Löschung, Portabilität) nicht implementiert | `delete_user_data()` Funktion implementiert (`20260411110000`); danach auth.user via Admin API löschen | Claude | Erledigt | — | Verantwortlicher vs. Auftragsverarbeiter pro Theater klären | Erledigt |
| Kritisch | DSGVO | Datenpannen-Meldepflicht (72h) nicht vorbereitet | Incident-Response-Prozess definieren; Kontakte zu EDÖB (CH) und BfDI (DE) festhalten | Du | Vor Go-Live | — | | Offen |
| Kritisch | DSGVO | Personendaten im Netzwerk-Suchmodus sichtbar (z.B. Telefonnummer über Profile) | Profile-RLS eingeschränkt (`20260411100000`); `public_profile_for_network` View ohne Telefon/Avatar | Claude | Erledigt | — | Profil nur noch für Co-Members sichtbar | Erledigt |
| Kritisch | DSGVO | Keine Aufbewahrungsfristen für Personendaten definiert | `run_dsgvo_cleanup()` implementiert (`20260411120000`); Einladungslinks, Cart, Threads werden bereinigt | Claude (Technik) / Du (Fristen definieren) | Technik erledigt / Du: Fristen festlegen | Wöchentlich via Cron | | Teilweise erledigt |
| Kritisch | Backups | Supabase Free Plan hat keine zuverlässigen Backups | Supabase Pro buchen ($25/Monat, tägliche Backups, 7 Tage Retention); PITR evaluieren | Du | Kurz vor Go-Live | — | PITR nur ab Pro+ verfügbar | Offen |
| Kritisch | Backups | Tenant-granularer Restore nicht möglich | Export-Skript implementiert: `scripts/export-theater-data.sh` | Claude | Erledigt | Wöchentlich | `--all` Flag für alle Theater | Erledigt |
| Kritisch | Backups | Supabase Storage (Bilder) nicht in DB-Backups enthalten | Backup-Skript implementiert: `scripts/backup-storage.sh` | Claude | Erledigt | Wöchentlich | Alte Backups werden nach 30 Tagen automatisch bereinigt | Erledigt |
| Hoch | Netzwerk-Sichtbarkeit | Kostüme beim Netzwerkbeitritt ungewollt sichtbar (NULL-Default) | `is_visible = false` beim Beitritt explizit gesetzt; Runbook: `docs/network-migration-runbook.md` | Claude | Erledigt | — | Default `'none'` in `theater_networks.default_visibility` | Erledigt |
| Hoch | Netzwerk-Sichtbarkeit | Blocking-Logik greift nicht auf allen Query-Ebenen | `costume_visible_to_theater()` in Migration `20260410140000` implementiert | Claude | Erledigt | Bei jeder neuen Query die Netzwerke nutzt | Funktion in RLS-Policies einbinden | Erledigt |
| Hoch | Fachlich | Sichtbar ≠ Ausleihbar — nachträgliche Schema-Änderung aufwändig | `is_lendable`-Flag implementiert: Migration `20260410160000`; `costume_lendable_to_theater()` Funktion vorhanden | Claude | Erledigt | — | Offene Frage Nr. 1 mit Partnern klären | Erledigt |
| Mittel | Infrastruktur | Supabase-Ausfall (Single Region Frankfurt) legt alle Theater lahm | Statische Statusseite erstellt: `public/status.html`; erreichbar auch bei App-Ausfall | Claude (Statusseite) / Du (Verträge, DNS) | Erledigt (Seite) / Du: SLA in Verträge | — | SLA Supabase Pro: 99.9% | Teilweise erledigt |
| Mittel | Infrastruktur | Supabase-Konto-Sperre oder Preis-Änderung | Regelmässige DB-Exports via `scripts/export-theater-data.sh --all` | Claude (Skript erledigt) / Du (Prozess etablieren) | Erledigt (Skript) | Monatlich als Vollsicherung | Daten portierbar zu jeder PostgreSQL-Instanz | Teilweise erledigt |
| Mittel | Infrastruktur | RTO/RPO nicht definiert | RTO ≤ 4h / RPO ≤ 24h mit Theater-Partnern abstimmen und in SLA festhalten | Du | Vor erstem Partner-Onboarding | — | | Offen |
| Mittel | Sicherheit | Einladungslinks können weitergegeben werden | `invitations`-Tabelle vorbereitet (`20260411120000`): 7-Tage-Ablauf, Single-Use, E-Mail-Bindung möglich | Claude | Erledigt (Tabelle) / Offen (UI) | — | UI-Implementierung beim Einladungs-Feature | Teilweise erledigt |
| Mittel | Fachlich | Case 3 Kollektivfundus unspezifiziert — Breaking Changes möglich | Case 3 vor Schema-Freeze spezifizieren; `owner_type`/`owner_id`-Pattern vorbereiten | Du (Spezifikation) / Claude (Schema) | Vor Schema-Freeze | — | Offene Frage Nr. 2 | Offen |
| Niedrig | Betrieb | Einzel→Netzwerk-Migration ohne definiertem Prozess fehleranfällig | Runbook erstellt: `docs/network-migration-runbook.md` inkl. Rollback-Skript | Claude | Erledigt | — | Pricing (Offene Frage Nr. 4) vorab klären | Erledigt |

---

## Wiederkehrende Aufgaben

| Aufgabe | Script / Tool | Empfohlenes Intervall | Hinweis |
|---|---|---|---|
| Tenant DB-Export (alle Theater) | `scripts/export-theater-data.sh --all` | Wöchentlich | Vor jeder grossen Migration zusätzlich ausführen |
| Storage-Bucket-Backup (Bilder) | `scripts/backup-storage.sh` | Wöchentlich | Alte Backups werden nach 30 Tagen automatisch bereinigt |
| DSGVO-Cleanup (Einladungslinks, Cart, Threads) | `SELECT run_dsgvo_cleanup();` im SQL Editor | Wöchentlich | Oder via Supabase Edge Function (Cron) |
| Vollständiger DB-Dump (Exit-Strategie) | Supabase Dashboard → Backups oder `pg_dump` | Monatlich | Als Absicherung gegen Konto-Sperre oder Provider-Wechsel |
| RLS-Policy-Tests | `pg_tap` (noch aufzusetzen) | Bei jeder neuen Migration | Sicherstellen dass Cross-Tenant-Zugriff ausgeschlossen ist |
| Audit-Log Review | Supabase SQL Editor → `SELECT * FROM platform_audit_log ORDER BY created_at DESC` | Monatlich (oder bei Verdacht) | Platform-Admin-Aktionen prüfen |
