
-- 1. device_pair_tokens: explicit lockdown (service-role only via Edge/server)
CREATE POLICY "device_pair_tokens service only"
ON public.device_pair_tokens
FOR ALL TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 2. Revoke broad EXECUTE on all public functions from anonymous callers
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 3. Re-grant EXECUTE to authenticated users only for user-callable RPCs
DO $$
DECLARE
  fn text;
  user_fns text[] := ARRAY[
    'accept_arena_match(uuid, text)',
    'accept_consent(integer)',
    'activate_premium_pass(text)',
    'award_battle_xp(boolean)',
    'board_cast_vote(uuid, boolean)',
    'board_claim(uuid, boolean)',
    'board_create_match(text, integer, text)',
    'board_join_match(uuid)',
    'board_propose_vote(uuid, text, uuid)',
    'board_roll(uuid, text, text, text)',
    'board_select_card(uuid, text, text, text)',
    'board_set_mode(uuid, text)',
    'board_skip(uuid)',
    'board_start_match(uuid)',
    'board_upgrade(uuid)',
    'buy_chests(integer)',
    'cancel_arena_match(uuid)',
    'cancel_listing(uuid)',
    'claim_daily_coins()',
    'claim_daily_exod()',
    'claim_free_pack(uuid)',
    'create_arena_match(text, numeric, text)',
    'earn_exod(numeric, text, text)',
    'exchange_cards_for_credit(jsonb)',
    'list_card_for_ankh(text, numeric)',
    'open_chest()',
    'purchase_listing(uuid)',
    'purchase_listing_ankh(uuid)',
    'record_suspicion(text, integer, jsonb)',
    'register_tournament(uuid)',
    'report_arena_result(uuid, uuid)',
    'send_message(uuid, uuid, text)',
    'set_recovery_key(text)',
    'set_username(text)',
    'admin_resolve_arena_dispute(uuid, uuid, text)',
    'log_mod_action(text, uuid, text, text, integer, jsonb)',
    'moderate_delete_message(uuid, text)',
    'resolve_user_report(uuid, text, text)',
    'credit_ankh(uuid, numeric, text)',
    'void_user_battle(uuid, integer, numeric, text)',
    'grant_free_pack_credit(uuid, integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY user_fns LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      -- skip if signature changed
      NULL;
    END;
  END LOOP;
END $$;

-- 4. Helpers used inside RLS policies: must remain executable by both anon + authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_board_player(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_conv_participant(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_card_staked(uuid, text) TO anon, authenticated;

-- 5. Public profile lookup stays public
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

-- 6. Device pair RPCs: called from un-signed-in flow, but only from server fns; allow anon
GRANT EXECUTE ON FUNCTION public.device_pair_request(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_pair_poll(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_pair_lookup(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_pair_mark_approved(text, text, text) TO authenticated;

-- 7. unlock_achievement is internal; revoked above and intentionally NOT re-granted
-- (called from server-side helpers/triggers only)
