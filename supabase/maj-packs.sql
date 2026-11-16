-- Team Ulysse : onglet « Packs » de l'espace admin (qui a ouvert son pack du jour).
-- À copier une seule fois dans Supabase › SQL Editor › Run.
-- Chaque téléphone inscrit envoie l'historique de ses packs du jour à l'ouverture de l'appli.

create table if not exists public.packs_suivi (
  participant_id uuid primary key references public.participants (id) on delete cascade,
  -- [{ "jour": "2026-11-16", "at": "2026-11-16T07:34:00Z" }, …] : packs du jour (sans les bonus).
  packs jsonb not null default '[]',
  -- Nombre de cartes différentes dans la collection.
  cartes int not null default 0,
  -- Dernière ouverture de l'appli sur un téléphone de la personne.
  vu_le timestamptz not null default now()
);
alter table public.packs_suivi enable row level security;
revoke all on public.packs_suivi from anon, authenticated;

create or replace function public.envoyer_packs(p_jeton uuid, p_packs jsonb, p_cartes int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := (select id from participants where jeton = p_jeton);
begin
  if pid is null then return; end if;
  if jsonb_typeof(p_packs) <> 'array' or jsonb_array_length(p_packs) > 1000 then
    raise exception 'Historique invalide';
  end if;
  insert into packs_suivi (participant_id, packs, cartes, vu_le)
  values (pid, p_packs, greatest(0, least(coalesce(p_cartes, 0), 1000)), now())
  on conflict (participant_id) do update set
    packs = excluded.packs, cartes = excluded.cartes, vu_le = now();
end $$;
revoke execute on function public.envoyer_packs(uuid, jsonb, int) from public;
grant execute on function public.envoyer_packs(uuid, jsonb, int) to anon, authenticated;

create or replace function public.admin_packs(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'participant_id', participant_id, 'packs', packs, 'cartes', cartes, 'vu_le', vu_le))
    from packs_suivi), '[]');
end $$;
revoke execute on function public.admin_packs(text) from public;
grant execute on function public.admin_packs(text) to anon, authenticated;
