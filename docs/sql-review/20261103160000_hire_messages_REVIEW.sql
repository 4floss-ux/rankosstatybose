-- PROPOSAL ONLY. DO NOT APPLY AUTOMATICALLY.
-- Reviewer confirmed foreign_employer_sessions.revoked_at exists. Still review
-- session semantics, additional-request account links and existing deletion RPCs.
-- Not placed in supabase/migrations; no live database execution authorized here.
BEGIN;

CREATE TABLE public.foreign_hire_messages (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  -- One conversation per employer account, stored under its original request.
  -- Deleting an additional need does not delete the shared company conversation.
  -- Deleting the original request removes its messages in the same transaction.
  request_id uuid NOT NULL REFERENCES public.foreign_hire_requests(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  sender_kind text NOT NULL CHECK (sender_kind IN ('admin', 'employer')),
  admin_id uuid REFERENCES public.profiles(id),
  employer_account_id uuid REFERENCES public.foreign_employer_accounts(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (request_id, client_id),
  CHECK ((sender_kind = 'admin' AND admin_id IS NOT NULL AND employer_account_id IS NULL)
      OR (sender_kind = 'employer' AND admin_id IS NULL AND employer_account_id IS NOT NULL))
);
CREATE INDEX foreign_hire_messages_request_created_idx
  ON public.foreign_hire_messages(request_id, created_at DESC, id DESC);
ALTER TABLE public.foreign_hire_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.foreign_hire_messages FROM PUBLIC, anon, authenticated;
-- No direct browser table access or Realtime publication. Only authorized RPCs.

CREATE FUNCTION app_private.hire_message_admin_request(p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_request uuid;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  -- Additional needs reference the same employer account. Resolve the supplied
  -- request to that account's ORIGINAL request, matching the employer RPCs.
  SELECT a.request_id INTO v_request
  FROM public.foreign_hire_requests r
  JOIN public.foreign_employer_accounts a
    ON a.id = r.employer_account_id
       OR (r.employer_account_id IS NULL AND a.request_id = r.id)
  WHERE r.id = p_request_id AND a.is_active = true;
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Conversation unavailable' USING ERRCODE = '42501';
  END IF;
  RETURN v_request;
END;
$fn$;

CREATE FUNCTION app_private.hire_message_employer_account(p_session_token text)
RETURNS public.foreign_employer_accounts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_account public.foreign_employer_accounts;
BEGIN
  IF p_session_token IS NULL OR char_length(p_session_token) <> 64 THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  SELECT a.* INTO v_account
  FROM public.foreign_employer_accounts a
  JOIN public.foreign_employer_sessions s ON s.employer_account_id = a.id
  WHERE s.token_hash = encode(extensions.digest(p_session_token, 'sha256'), 'hex')
    AND s.expires_at > clock_timestamp()
    AND s.revoked_at IS NULL
    AND a.is_active = true
    AND a.must_change_password = false;
  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;
  RETURN v_account;
END;
$fn$;
REVOKE ALL ON FUNCTION app_private.hire_message_admin_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.hire_message_employer_account(text) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.hire_admin_messages(p_request_id uuid)
RETURNS TABLE (id uuid, sender_kind text, body text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_request uuid;
  v_account public.foreign_employer_accounts;
  v_id uuid;
BEGIN
  v_request := app_private.hire_message_admin_request(p_request_id);
  RETURN QUERY SELECT recent.id, recent.sender_kind, recent.body, recent.created_at
  FROM (SELECT m.id, m.sender_kind, m.body, m.created_at
        FROM public.foreign_hire_messages m WHERE m.request_id = v_request
        ORDER BY m.created_at DESC, m.id DESC LIMIT 100) recent
  ORDER BY recent.created_at, recent.id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.hire_admin_messages(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hire_admin_messages(uuid) TO authenticated;

CREATE FUNCTION public.hire_admin_send_message(p_request_id uuid, p_body text, p_client_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_request uuid;
  v_account public.foreign_employer_accounts;
  v_id uuid;
BEGIN
  v_request := app_private.hire_message_admin_request(p_request_id);
  IF p_client_id IS NULL OR p_body IS NULL
     OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.foreign_hire_messages
    (request_id, client_id, sender_kind, admin_id, employer_account_id, body)
  VALUES (v_request, p_client_id, 'admin', auth.uid(), NULL, btrim(p_body))
  ON CONFLICT (request_id, client_id) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT m.id INTO v_id FROM public.foreign_hire_messages m
    WHERE m.request_id = v_request AND m.client_id = p_client_id
      AND m.sender_kind = 'admin' AND m.body = btrim(p_body)
      AND m.admin_id IS NOT DISTINCT FROM auth.uid()
      AND m.employer_account_id IS NOT DISTINCT FROM NULL;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Message identifier conflict' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN v_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.hire_admin_send_message(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hire_admin_send_message(uuid, text, uuid) TO authenticated;

CREATE FUNCTION public.hire_employer_messages(p_session_token text)
RETURNS TABLE (id uuid, sender_kind text, body text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_request uuid;
  v_account public.foreign_employer_accounts;
  v_id uuid;
BEGIN
  v_account := app_private.hire_message_employer_account(p_session_token);
  v_request := v_account.request_id;
  RETURN QUERY SELECT recent.id, recent.sender_kind, recent.body, recent.created_at
  FROM (SELECT m.id, m.sender_kind, m.body, m.created_at
        FROM public.foreign_hire_messages m WHERE m.request_id = v_request
        ORDER BY m.created_at DESC, m.id DESC LIMIT 100) recent
  ORDER BY recent.created_at, recent.id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.hire_employer_messages(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hire_employer_messages(text) TO anon, authenticated;

CREATE FUNCTION public.hire_employer_send_message(p_session_token text, p_body text, p_client_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_request uuid;
  v_account public.foreign_employer_accounts;
  v_id uuid;
BEGIN
  v_account := app_private.hire_message_employer_account(p_session_token);
  v_request := v_account.request_id;
  IF p_client_id IS NULL OR p_body IS NULL
     OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.foreign_hire_messages
    (request_id, client_id, sender_kind, admin_id, employer_account_id, body)
  VALUES (v_request, p_client_id, 'employer', NULL, v_account.id, btrim(p_body))
  ON CONFLICT (request_id, client_id) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT m.id INTO v_id FROM public.foreign_hire_messages m
    WHERE m.request_id = v_request AND m.client_id = p_client_id
      AND m.sender_kind = 'employer' AND m.body = btrim(p_body)
      AND m.admin_id IS NOT DISTINCT FROM NULL
      AND m.employer_account_id IS NOT DISTINCT FROM v_account.id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Message identifier conflict' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN v_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.hire_employer_send_message(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hire_employer_send_message(text, text, uuid) TO anon, authenticated;

COMMIT;
