-- Team Ulysse : l'administrateur offre une carte à une personne inscrite.
-- La carte arrive sur le téléphone de la personne à sa prochaine ouverture de l'appli.
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).

create table if not exists public.cadeaux (
  code text primary key,
  carte text not null check (char_length(carte) < 80),
  cree_le timestamptz not null default now(),
  utilise_le timestamptz,
  appareil uuid
);
alter table public.cadeaux
  add column if not exists participant_id uuid references public.participants (id) on delete cascade;
alter table public.cadeaux enable row level security;
revoke all on public.cadeaux from anon, authenticated;

-- L'administrateur offre une carte à une personne inscrite.
create or replace function public.admin_offrir_carte(p_code text, p_participant uuid, p_carte text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform verifier_code(p_code);
  if not exists (select 1 from participants where id = p_participant) then
    raise exception 'Personne introuvable';
  end if;
  insert into cadeaux (code, carte, participant_id)
  values (upper(encode(extensions.gen_random_bytes(8), 'hex')), p_carte, p_participant);
end $$;

-- Le téléphone de la personne récupère ses cartes offertes (une seule fois chacune).
create or replace function public.recuperer_cadeaux(p_jeton uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := (select id from participants where jeton = p_jeton);
  r jsonb;
begin
  if pid is null then return '[]'; end if;
  with pris as (
    update cadeaux set utilise_le = now()
    where participant_id = pid and utilise_le is null
    returning carte, cree_le
  )
  select coalesce(jsonb_agg(carte order by cree_le), '[]') into r from pris;
  return r;
end $$;

revoke execute on function public.admin_offrir_carte(text, uuid, text), public.recuperer_cadeaux(uuid) from public;
grant execute on function public.admin_offrir_carte(text, uuid, text), public.recuperer_cadeaux(uuid) to anon, authenticated;
