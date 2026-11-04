-- REVIEW ONLY. Do not apply automatically. Extends existing candidate/chat read system.
-- No new notification table, email, payment, existing RPC replacement or historical events.
BEGIN;
ALTER TABLE public.job_ad_message_reads
  ADD COLUMN IF NOT EXISTS news_read_versions jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.job_ad_applications
  ADD COLUMN IF NOT EXISTS interview_notice_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_revision integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.job_ad_interview_notice_stamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Repeated confirmation / same-file retries do not create another event.
  IF OLD.interview_confirmed_at IS NOT NULL AND NEW.status = 'interview'
    AND (NEW.interview_at, NEW.interview_how, NEW.interview_address, NEW.interview_note)
      IS NOT DISTINCT FROM (OLD.interview_at, OLD.interview_how, OLD.interview_address, OLD.interview_note) THEN
    NEW.interview_confirmed_at := OLD.interview_confirmed_at;
  END IF;
  IF OLD.cv_sent_at IS NOT NULL AND NEW.cv_sent_at IS NOT NULL
    AND (NEW.cv_path, NEW.cv_name) IS NOT DISTINCT FROM (OLD.cv_path, OLD.cv_name) THEN
    NEW.cv_sent_at := OLD.cv_sent_at;
  END IF;
  IF NEW.status = 'interview' AND NEW.interview_at IS NOT NULL AND
    (OLD.interview_at, OLD.interview_how, OLD.interview_address, OLD.interview_note)
    IS DISTINCT FROM
    (NEW.interview_at, NEW.interview_how, NEW.interview_address, NEW.interview_note) THEN
    NEW.interview_notice_at := clock_timestamp();
    NEW.interview_revision := CASE WHEN OLD.interview_at IS NULL THEN 1 ELSE greatest(OLD.interview_revision, 1) + 1 END;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.job_ad_interview_notice_stamp() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS job_ad_interview_notice_stamp ON public.job_ad_applications;
CREATE TRIGGER job_ad_interview_notice_stamp BEFORE UPDATE ON public.job_ad_applications
FOR EACH ROW EXECUTE FUNCTION public.job_ad_interview_notice_stamp();

CREATE OR REPLACE FUNCTION public.job_ad_news(p_company_id uuid DEFAULT NULL)
RETURNS TABLE (application_id uuid, ad_id uuid, chat_unread integer, events jsonb, observed_at timestamptz, participant_name text, ad_title text, application_status text, chat_latest_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.id, a.ad_id, coalesce(u.unread, 0), ev.items, statement_timestamp(),
    CASE WHEN access.side = 'company' THEN p.display_name ELSE c.name END, ad.title, a.status,
    (SELECT max(m.created_at) FROM public.job_ad_messages m WHERE m.application_id = a.id)
  FROM public.job_ad_applications a
  JOIN public.job_ads ad ON ad.id = a.ad_id
  JOIN public.profiles p ON p.id = a.worker_id
  JOIN public.companies c ON c.id = ad.company_id
  CROSS JOIN LATERAL (SELECT public.job_ad_chat_side(a.id) AS side) access
  LEFT JOIN public.job_ad_message_reads r ON r.application_id = a.id AND r.side = access.side
  LEFT JOIN public.job_ad_chat_unread() u ON u.application_id = a.id
  CROSS JOIN LATERAL (
    SELECT coalesce(jsonb_agg(jsonb_build_object('kind', n.kind, 'label', n.label, 'version', n.at::text,
      'interview_at', CASE WHEN n.kind IN ('interview', 'interview_changed', 'confirmed') THEN a.interview_at END)
      ORDER BY n.at, n.kind), '[]'::jsonb) AS items
    FROM (VALUES
      ('cv_uploaded', 'Kandidatas įkėlė CV', a.cv_sent_at, 'company'),
      ('confirmed', 'Kandidatas patvirtino pokalbio laiką', a.interview_confirmed_at, 'company'),
      ('cv_requested', 'Įmonė prašo CV', CASE WHEN a.cv_sent_at IS NULL THEN a.cv_requested_at END, 'worker'),
      (CASE WHEN a.interview_revision > 1 THEN 'interview_changed' ELSE 'interview' END,
       CASE WHEN a.interview_revision > 1 THEN 'Pakeistas pokalbio laikas' ELSE 'Kvietimas į pokalbį' END,
       CASE WHEN a.status = 'interview' THEN a.interview_notice_at END, 'worker')
    ) n(kind, label, at, recipient)
    WHERE n.recipient = access.side AND n.at IS NOT NULL AND (r.news_read_versions ->> n.kind) IS DISTINCT FROM n.at::text
      AND n.at <= statement_timestamp()
  ) ev
  WHERE auth.uid() IS NOT NULL AND access.side IS NOT NULL AND ad.status <> 'removed'
    AND (p_company_id IS NULL OR ad.company_id = p_company_id)
    AND public.account_can_use_platform(auth.uid()) IS TRUE
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_active = true)
    -- Keep every existing conversation, even with no unread messages or events.
    AND (coalesce(u.unread, 0) > 0 OR jsonb_array_length(ev.items) > 0
      OR EXISTS (SELECT 1 FROM public.job_ad_messages m WHERE m.application_id = a.id));
$$;

CREATE OR REPLACE FUNCTION public.job_ad_news_read(p_application_id uuid, p_events jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_side text := public.job_ad_chat_side(p_application_id); v_versions jsonb;
BEGIN
  IF auth.uid() IS NULL OR v_side IS NULL
    OR public.account_can_use_platform(auth.uid()) IS DISTINCT FROM TRUE OR NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_active = true
  ) THEN RAISE EXCEPTION 'Neturite prieigos.' USING ERRCODE = '42501'; END IF;
  IF p_events IS NULL OR jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'Netinkami perskaityti įvykiai.';
  END IF;
  IF jsonb_array_length(p_events) NOT BETWEEN 1 AND 4 OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_events) e
    WHERE coalesce(e->>'kind', '') NOT IN ('cv_uploaded','confirmed','cv_requested','interview','interview_changed')
      OR coalesce(e->>'version', '') = '' OR length(e->>'version') > 80
      OR NOT isfinite((e->>'version')::timestamptz) OR (e->>'version')::timestamptz > clock_timestamp()
  ) THEN RAISE EXCEPTION 'Netinkami perskaityti įvykiai.'; END IF;
  SELECT jsonb_object_agg(e->>'kind', e->>'version') INTO v_versions FROM jsonb_array_elements(p_events) e;
  -- Acknowledge only rendered event versions, never a blanket time watermark.
  -- A concurrently received new CV / interview stays unread. Chat reads are untouched.
  INSERT INTO public.job_ad_message_reads(application_id, side, read_at, news_read_versions)
  VALUES (p_application_id, v_side, '-infinity', v_versions)
  ON CONFLICT (application_id, side) DO UPDATE
    SET news_read_versions = (
      SELECT jsonb_object_agg(e.key, greatest(
        (public.job_ad_message_reads.news_read_versions->>e.key)::timestamptz,
        e.value::timestamptz)::text)
      FROM jsonb_each_text(public.job_ad_message_reads.news_read_versions || excluded.news_read_versions) e
    );
END $$;
REVOKE ALL ON FUNCTION public.job_ad_news(uuid), public.job_ad_news_read(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_ad_news(uuid), public.job_ad_news_read(uuid,jsonb) TO authenticated;
COMMIT;
