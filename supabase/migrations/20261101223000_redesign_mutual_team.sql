-- Redizainas: „Nuolatinė komanda“ – įmonė įsiminė darbuotoją IR darbuotojas pažymėjo įmonę mėgstama.
-- Tik papildymas: viena skaitymo RPC. Grąžina tik abipusius ryšius dabartiniam darbuotojui.
create or replace function public.get_worker_mutual_companies()
returns table (company_id uuid)
language sql stable security definer set search_path = '' as $$
  select f.company_id
  from public.worker_favorite_companies f
  join public.company_saved_workers s on s.company_id = f.company_id and s.worker_id = f.worker_id
  where f.worker_id = auth.uid();
$$;
revoke all on function public.get_worker_mutual_companies() from public, anon;
grant execute on function public.get_worker_mutual_companies() to authenticated;
