# Security Policy & Prozesse

> **Status: VORLAGE** — die mit _kursiv_ markierten Stellen müssen befüllt werden.
>
> **Zweck:** Sicherheits-Prozesse, die nicht aus Code oder Konfiguration ableitbar sind: Wer macht was bei einem Incident, wie werden Secrets rotiert, welche Account-Hygiene gilt.
>
> Wird vom Deep-Review §3 (Security) und §5 (Datenschutz) geprüft.

## 1. Verantwortliche Personen

| Rolle                        | Person | Kontakt  | Backup          |
| ---------------------------- | ------ | -------- | --------------- |
| Security-Verantwortlicher    | _Du_   | _E-Mail_ | _zu definieren_ |
| Datenschutz-Verantwortlicher | _Du_   | _E-Mail_ | _zu definieren_ |
| Plattform-Admin (Supabase)   | _Du_   | _E-Mail_ | _zu definieren_ |
| Plattform-Admin (Vercel)     | _Du_   | _E-Mail_ | _zu definieren_ |

## 2. Account-Hygiene & 2FA

**Pflicht-2FA für folgende Konten:**

- GitHub-Repository (Owner und alle Collaborators)
- Supabase-Konto (Platform Admins und alle DB-Zugriffe)
- Vercel-Konto
- Anthropic Console
- Domain-Registrar
- E-Mail-Konto, das mit den oben genannten verknüpft ist

**Verifikation:** _Manuell, alle 6 Monate. Nächste Prüfung: \_zu definieren_.\_

**Anzahl Platform Admins:** _zu definieren_, Minimalprinzip. Aktuelle Liste:

- _Person 1_
- _Person 2_

## 3. Secret-Rotation

### Auslöser für sofortige Rotation

- Secret in Git-History gefunden (auch wenn aus HEAD entfernt)
- Verdächtige Aktivität in Audit-Logs
- Mitarbeiter/Collaborator scheidet aus
- Verlorenes oder kompromittiertes Gerät
- Phishing-Verdacht

### Rotations-Prozess pro Plattform

**Supabase Service-Role-Key:**

1. Supabase Dashboard → Settings → API → "Reset service role key"
2. Neuen Key in Vercel-Env aktualisieren (Production + Preview)
3. Re-Deploy auslösen
4. Audit-Log der letzten 30 Tage auf verdächtige Zugriffe prüfen
5. Eintrag in `SECURITY.md` Abschnitt 6

**Anthropic API Key:**

1. console.anthropic.com → API Keys → alten Key löschen, neuen erstellen
2. Vercel-Env aktualisieren, re-deploy
3. Eintrag in Abschnitt 6

**Datenbank-Passwort (Supabase):**

1. Supabase Dashboard → Settings → Database → Reset password
2. Connection-Strings überall aktualisieren (lokal in `.env`, Vercel-Env, Backup-Skripte)
3. Eintrag in Abschnitt 6

**Sonstige Service-Credentials:** Analoger Prozess auf der jeweiligen Plattform.

## 4. Datenpannen-Meldepflicht

DSGVO Art. 33: **72 Stunden ab Kenntnis** an Aufsichtsbehörde melden.

### Aufsichtsbehörden

- **Schweiz (revDSG):** EDÖB — Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter
  - Web: edoeb.admin.ch
  - Meldeformular: _Link einfügen_
- **Deutschland (DSGVO):** Zuständige Landesdatenschutzbehörde nach Sitz des betroffenen Theaters
  - Übersicht: _Link einfügen_
- **EU (allgemein):** zuständige nationale Behörde, ggf. EDPB-Kontakte: _Link einfügen_

### Incident-Response-Schritte

1. **Eindämmung** (innerhalb 1 Stunde):
   - Betroffene Accounts/Keys deaktivieren
   - Falls Datenleck: Datenbank-Zugriff einschränken
2. **Beweissicherung**:
   - Audit-Logs sichern (Supabase, Vercel, GitHub)
   - Screenshots/Exports archivieren
3. **Bewertung** (innerhalb 24 Stunden):
   - Welche Datenkategorien betroffen?
   - Wie viele Personen betroffen?
   - Welches Risiko für Betroffene?
4. **Meldung** (innerhalb 72 Stunden):
   - An zuständige Behörde
   - Bei hohem Risiko: an Betroffene direkt (Art. 34)
   - Theater-Partner informieren (Auftragsverarbeitung)
5. **Aufarbeitung**:
   - Root-Cause-Analyse
   - Eintrag in Abschnitt 6
   - Massnahmen zur Verhinderung

## 5. Eingebaute Sicherheits-Layer (Defense in Depth)

- **Layer 1:** Pre-Commit Regex-Secret-Scan (`.githooks/pre-commit`)
- **Layer 2:** AI Pre-Commit Review (`.claude/agents/review-quick.md` Kategorie D)
- **Layer 3:** Weekly + Deep Repo- und Git-History-Scan
- **Layer 4:** _GitHub Actions mit gitleaks (zu aktivieren)_
- **Layer 5:** _GitHub Push Protection (zu aktivieren)_
- **Layer 6:** Diese Datei (Rotation-Prozess + Account-Hygiene)

## 6. Incident- & Rotations-Log

Chronologisch, neueste zuerst.

```
## YYYY-MM-DD — <Incident | Routine-Rotation> — <kurze Beschreibung>
- Auslöser: ...
- Betroffene Systeme: ...
- Massnahmen: ...
- Dauer bis Eindämmung: ...
- Behördenmeldung erfolgt: ja/nein/n.a.
- Lessons learned: ...
```

_Noch keine Einträge._

## 7. Verweise

- Risiko-Tracking: `architecture-risks.md`
- Datenschutz-Fristen: `docs/data-retention.md`
- Reviews: `.claude/agents/review-deep.md` §3 + §5
