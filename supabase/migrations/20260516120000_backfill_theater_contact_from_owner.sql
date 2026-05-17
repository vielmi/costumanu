-- Backfill contact_name and contact_email on theaters
-- from the theater owner's profile display_name and auth email.
-- Only fills theaters where contact_email is not yet set.
UPDATE theaters t
SET
  contact_name  = p.display_name,
  contact_email = u.email
FROM theater_members tm
JOIN auth.users  u ON u.id = tm.user_id
JOIN profiles    p ON p.id = tm.user_id
WHERE tm.theater_id = t.id
  AND tm.role = 'owner'
  AND (t.contact_email IS NULL OR t.contact_email = '');
