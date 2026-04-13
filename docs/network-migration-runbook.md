# Runbook: Einzel-Instanz → Netzwerk-Migration

Dieses Dokument beschreibt den Prozess, wenn ein Theater von einer Einzel-Instanz
in ein bestehendes Netzwerk migriert werden soll. Nur Platform Admins führen
diese Migration durch (kein Self-Service).

---

## Voraussetzungen

- [ ] Theater existiert bereits in der DB (`theaters`-Tabelle)
- [ ] Netzwerk existiert bereits (`theater_networks`-Tabelle)
- [ ] Theater-Owner wurde informiert und hat zugestimmt
- [ ] Pricing-Modell ist mit dem Theater geklärt
- [ ] Platform Admin hat Zugang zur Supabase DB (SQL Editor oder CLI)

---

## Schritt 1 — Theater-Daten prüfen

Im Supabase SQL Editor ausführen:

```sql
-- Theater und bestehende Kostüme prüfen
SELECT
  t.id,
  t.name,
  t.slug,
  COUNT(c.id) AS kostüme_total,
  COUNT(CASE WHEN ci.is_public_for_rent THEN 1 END) AS kostüme_öffentlich
FROM theaters t
LEFT JOIN costumes c ON c.theater_id = t.id
LEFT JOIN costume_items ci ON ci.theater_id = t.id
WHERE t.id = '<THEATER_ID>'
GROUP BY t.id, t.name, t.slug;

-- Bestehende Sichtbarkeits-Einträge prüfen
SELECT COUNT(*) FROM costume_network_visibility cnv
JOIN costumes c ON c.id = cnv.costume_id
WHERE c.theater_id = '<THEATER_ID>';
```

---

## Schritt 2 — Theater dem Netzwerk hinzufügen

```sql
INSERT INTO theater_network_members (network_id, theater_id, added_by)
VALUES (
  '<NETWORK_ID>',
  '<THEATER_ID>',
  auth.uid()  -- Platform Admin User ID
);
```

Der Trigger `audit_network_membership` schreibt automatisch einen Audit-Eintrag.

---

## Schritt 3 — Sichtbarkeit sicherstellen (Default: nicht sichtbar)

Nach dem Netzwerkbeitritt sind alle Kostüme standardmässig **nicht sichtbar**.
Das folgende Script stellt sicher, dass für alle Kostüme ein Eintrag mit
`is_visible = false` existiert (verhindert NULL-Zustand):

```sql
-- Explizit is_visible = false für alle Kostüme setzen
INSERT INTO costume_network_visibility (costume_id, network_id, is_visible, is_lendable)
SELECT
  c.id,
  '<NETWORK_ID>',
  false,
  false
FROM costumes c
WHERE c.theater_id = '<THEATER_ID>'
ON CONFLICT (costume_id, network_id) DO NOTHING;

-- Prüfen ob alle Kostüme einen Eintrag haben
SELECT
  COUNT(*) AS kostüme_ohne_sichtbarkeit_eintrag
FROM costumes c
LEFT JOIN costume_network_visibility cnv
  ON cnv.costume_id = c.id AND cnv.network_id = '<NETWORK_ID>'
WHERE c.theater_id = '<THEATER_ID>'
  AND cnv.costume_id IS NULL;
-- Ergebnis muss 0 sein!
```

---

## Schritt 4 — Theater-Owner informieren

Der Theater-Owner muss informiert werden, dass:
- Das Theater jetzt im Netzwerk ist
- Alle Kostüme standardmässig **nicht sichtbar** sind
- Er/sie Kostüme einzeln freigeben kann (in der App unter Suchmodus-Einstellungen)
- Er/sie Theater im Netzwerk blocken kann (falls gewünscht)

---

## Schritt 5 — Verifikation

```sql
-- Netzwerk-Mitgliedschaft bestätigen
SELECT
  tn.name AS netzwerk,
  t.name AS theater,
  tnm.joined_at
FROM theater_network_members tnm
JOIN theater_networks tn ON tn.id = tnm.network_id
JOIN theaters t ON t.id = tnm.theater_id
WHERE tnm.theater_id = '<THEATER_ID>';

-- Audit-Log prüfen
SELECT action, new_data, created_at
FROM platform_audit_log
WHERE target_id = '<THEATER_ID>'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Rollback (falls nötig)

```sql
-- Theater aus Netzwerk entfernen (Audit-Trigger schreibt automatisch)
DELETE FROM theater_network_members
WHERE network_id = '<NETWORK_ID>'
  AND theater_id = '<THEATER_ID>';

-- Sichtbarkeits-Einträge entfernen
DELETE FROM costume_network_visibility cnv
USING costumes c
WHERE cnv.costume_id = c.id
  AND c.theater_id = '<THEATER_ID>'
  AND cnv.network_id = '<NETWORK_ID>';
```

---

## Platzhalter ersetzen

| Platzhalter | Beschreibung | Wo finden |
|---|---|---|
| `<THEATER_ID>` | UUID des Theaters | `theaters`-Tabelle |
| `<NETWORK_ID>` | UUID des Netzwerks | `theater_networks`-Tabelle |
