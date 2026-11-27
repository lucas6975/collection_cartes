-- Team Ulysse : montées et descentes du classement (comme un classement de foot).
-- Chaque nuit (00 h 05, heure de Paris), le classement du moment est photographié. Les flèches
-- comparent la place EN DIRECT (packs, échanges…) à la place de cette photo : elles bougent au fil
-- de la journée, puis repartent de zéro chaque matin. Mêmes flèches pour tout le monde.
-- À copier dans Supabase › SQL Editor › Run (peut être relancé).

create table if not exists public.classement_photos (
  participant_id uuid not null references public.participants (id) on delete cascade,
  jour date not null,
  rang_cartes int not null,
  rang_echanges int not null,
  primary key (participant_id, jour)
);
alter table public.classement_photos enable row level security;
revoke all on public.classement_photos from anon, authenticated;

-- Places du moment (mêmes règles que l'appli : à égalité, même place).
create or replace function public.classement_rangs()
returns table (participant_id uuid, cartes int, legendaires int, echanges int, masque boolean,
               rang_cartes int, rang_echanges int)
language sql stable security definer set search_path = public as $$
  with b as (
    select p.id, s.cartes, s.legendaires, s.masque,
      (select count(*) from echanges e where e.etat = 'accepte'
        and (lower(e.nom_a) = lower(p.prenom || ' ' || p.nom)
          or lower(e.nom_b) = lower(p.prenom || ' ' || p.nom)))::int as echanges
    from packs_suivi s join participants p on p.id = s.participant_id
    where not s.hors_classement and s.cartes > 0
  )
  select id, cartes, legendaires, echanges, masque,
    (rank() over (order by cartes desc, legendaires desc))::int,
    (rank() over (order by echanges desc))::int
  from b;
$$;
revoke execute on function public.classement_rangs() from public, anon, authenticated;

create or replace function public.classement_photographier() returns int
language sql security definer set search_path = public as $$
  with ins as (
    insert into classement_photos (participant_id, jour, rang_cartes, rang_echanges)
    select participant_id, (now() at time zone 'Europe/Paris')::date, rang_cartes, rang_echanges
    from classement_rangs()
    on conflict (participant_id, jour) do nothing
    returning 1
  )
  select count(*)::int from ins;
$$;
revoke execute on function public.classement_photographier() from public, anon, authenticated;

create or replace function public.classement(p_jeton uuid default null, p_code text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  moi uuid := (select id from participants where jeton = p_jeton);
  v_jour date := (select max(jour) from classement_photos);
begin
  if moi is null then
    if p_code is null then raise exception 'Inscris-toi pour voir le classement'; end if;
    perform verifier_code(p_code);
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'cle', substr(md5(p.id::text), 1, 10),
      'prenom', case when r.masque then 'Joueur' else p.prenom end,
      'nom', case when r.masque then 'anonyme' else upper(left(p.nom, 1)) || '.' end,
      'cartes', r.cartes,
      'legendaires', r.legendaires,
      'echanges', r.echanges,
      'moi', p.id is not distinct from moi,
      -- Place sur la photo du jour (null : pas encore classé ce jour-là) ; photo : une photo existe.
      'avant_cartes', ph.rang_cartes,
      'avant_echanges', ph.rang_echanges,
      'photo', v_jour is not null
    ) order by r.cartes desc, r.legendaires desc, p.inscrit_le)
    from classement_rangs() r
    join participants p on p.id = r.participant_id
    left join classement_photos ph on ph.participant_id = r.participant_id and ph.jour = v_jour), '[]');
end $$;
revoke execute on function public.classement(uuid, text) from public;
grant execute on function public.classement(uuid, text) to anon, authenticated;

-- Photo chaque nuit à 00 h 05 (heure de Paris : 22 h 05 / 23 h 05 UTC selon la saison ; la photo
-- n'est prise qu'une fois par jour de Paris).
select cron.unschedule('team-ulysse-classement-photo') where exists (select 1 from cron.job where jobname = 'team-ulysse-classement-photo');
select cron.schedule('team-ulysse-classement-photo', '5 22,23 * * *', $$ select public.classement_photographier(); $$);

-- Première photo tout de suite.
select public.classement_photographier();
