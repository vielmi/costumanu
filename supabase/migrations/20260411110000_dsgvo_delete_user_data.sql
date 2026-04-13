-- ============================================================
-- MIGRATION: DSGVO — Lösch-Flow für Betroffenenrechte
-- ============================================================
-- Implementiert das Recht auf Löschung (Art. 17 DSGVO).
-- Funktion anonymisiert/löscht alle personenbezogenen Daten
-- eines Users, ohne Datenintegrität zu verletzen.
--
-- Aufruf via Supabase Admin API oder durch Platform Admin:
--   SELECT delete_user_data('<user_id>');
--
-- Danach muss der Auth-User via Supabase Admin API gelöscht werden:
--   supabase.auth.admin.deleteUser(userId)
-- ============================================================

CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_count  INTEGER;
BEGIN
  -- Nur Platform Admin darf diese Funktion aufrufen
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Nur Platform Admins dürfen Userdaten löschen.';
  END IF;

  -- 1. Chat-Nachrichten anonymisieren (Gesprächsintegrität erhalten)
  UPDATE chat_messages
  SET content = '[Nachricht gelöscht]',
      sender_id = p_user_id  -- bleibt als UUID, aber Profil wird gelöscht
  WHERE sender_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('chat_messages_anonymized', v_count);

  -- 2. Warenkorb löschen
  DELETE FROM cart_items WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('cart_items_deleted', v_count);

  -- 3. Wishlist-Kollaborationen entfernen
  DELETE FROM wishlist_collaborators WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('wishlist_collaborators_deleted', v_count);

  -- 4. Wishlists des Users löschen (inkl. wishlist_items via CASCADE)
  DELETE FROM wishlists WHERE owner_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('wishlists_deleted', v_count);

  -- 5. Chat-Thread-Teilnahmen entfernen
  DELETE FROM chat_thread_participants WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('chat_participations_deleted', v_count);

  -- 6. Rental Orders: borrower_user_id anonymisieren (Buchungshistorie erhalten)
  UPDATE rental_orders
  SET borrower_user_id = NULL
  WHERE borrower_user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('rental_orders_anonymized', v_count);

  -- 7. Theater-Mitgliedschaften entfernen
  DELETE FROM theater_members WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theater_memberships_deleted', v_count);

  -- 8. Audit-Log: performed_by anonymisieren (Log-Integrität erhalten)
  UPDATE platform_audit_log
  SET performed_by = NULL
  WHERE performed_by = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('audit_log_anonymized', v_count);

  -- 9. Profil löschen (CASCADE löscht auch auth.users-Referenzen)
  DELETE FROM profiles WHERE id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('profile_deleted', v_count);

  -- Audit-Eintrag für die Löschung selbst
  PERFORM write_audit_log(
    'user_data_deleted',
    'profiles',
    p_user_id,
    jsonb_build_object('reason', 'DSGVO Art. 17 — Recht auf Löschung'),
    v_result
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentar für Entwickler
COMMENT ON FUNCTION delete_user_data(UUID) IS
  'DSGVO Art. 17: Löscht/anonymisiert alle personenbezogenen Daten eines Users. '
  'Danach muss auth.user via Supabase Admin API gelöscht werden. '
  'Nur Platform Admins können diese Funktion aufrufen.';
