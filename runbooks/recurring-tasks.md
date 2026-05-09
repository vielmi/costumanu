# Wiederkehrende operative Aufgaben

> **Zweck:** Operative Skripte und Wartungs-Tasks mit ihren Auslösern und Intervallen.
>
> **Was hier nicht steht:** Strategische Risiken (`architecture-risks.md`), Code-/Doku-Reviews (`.claude/agents/review-*.md`).

| Aufgabe                                        | Script / Tool                                               | Intervall                 | Trigger                       | Hinweis                                                 |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------- | ----------------------------- | ------------------------------------------------------- |
| Tenant DB-Export (alle Theater)                | `scripts/export-theater-data.sh --all`                      | Wöchentlich               | Manuell / Cron                | Vor jeder grossen Migration zusätzlich ausführen        |
| Storage-Bucket-Backup (Bilder)                 | `scripts/backup-storage.sh`                                 | Wöchentlich               | Manuell / Cron                | Alte Backups werden nach 30 Tagen automatisch bereinigt |
| DSGVO-Cleanup (Einladungslinks, Cart, Threads) | `SELECT run_dsgvo_cleanup();` im SQL Editor                 | Wöchentlich               | Supabase Edge Function (Cron) | Fristen aus `docs/data-retention.md`                    |
| Vollständiger DB-Dump (Exit-Strategie)         | Supabase Dashboard → Backups oder `pg_dump`                 | Monatlich                 | Manuell                       | Absicherung gegen Konto-Sperre oder Provider-Wechsel    |
| RLS-Policy-Tests (`pg_tap`)                    | `pg_tap` (noch aufzusetzen)                                 | Bei jeder neuen Migration | CI                            | Aktuell offen — siehe `architecture-risks.md`           |
| Audit-Log Review                               | `SELECT * FROM platform_audit_log ORDER BY created_at DESC` | Monatlich                 | Deep-Review §3                | Wird im Deep-Review aktiv geprüft                       |

## Schedule der Reviews

| Review        | Intervall                   | Trigger                | Definition                        |
| ------------- | --------------------------- | ---------------------- | --------------------------------- |
| Quick Review  | Bei jedem Commit auf `main` | `.githooks/pre-commit` | `.claude/agents/review-quick.md`  |
| Weekly Review | Freitag 16:00               | Windows Task Scheduler | `.claude/agents/review-weekly.md` |
| Deep Review   | 1. des Monats 09:00         | Windows Task Scheduler | `.claude/agents/review-deep.md`   |
