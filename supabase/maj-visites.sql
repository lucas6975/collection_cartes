-- Team Ulysse : « Du lien à l'inscription » dans l'onglet Lancement de l'espace admin.
-- À copier une seule fois dans Supabase › SQL Editor › Run (après maj-lancement.sql).
-- Anonyme : aucun nom, seulement un numéro tiré au hasard par téléphone.

create table if not exists public.visites (
  appareil uuid not null,
  -- 'lien' : site ouvert dans le navigateur ; 'appli' : appli ouverte depuis l'icône, pas encore inscrit.
  etape text not null check (etape in ('lien', 'appli')),
  plateforme text not null check (plateforme in ('ios', 'android', 'ordi')),
  le timestamptz not null default now(),
  primary key (appareil, etape)
);
alter table public.visites enable row level security;
revoke all on public.visites from anon, authenticated;

-- Le téléphone signale une étape (une seule fois par téléphone et par étape).
create or replace function public.noter_visite(p_appareil uuid, p_etape text, p_plateforme text)
returns void
language sql security definer set search_path = public as $$
  insert into visites (appareil, etape, plateforme) values (p_appareil, p_etape, p_plateforme)
  on conflict do nothing
$$;
revoke execute on function public.noter_visite(uuid, text, text) from public;
grant execute on function public.noter_visite(uuid, text, text) to anon, authenticated;

-- Chiffres du lancement pour l'administrateur (remplace la version de maj-lancement.sql).
create or replace function public.admin_lancement(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  debut timestamptz := (select min(le) from visites);
begin
  perform verifier_code(p_code);
  return jsonb_build_object(
    'rappels', (select count(*) from rappels_abonnes),
    'avec_rappels', coalesce((
      select jsonb_agg(distinct participant_id) from rappels_abonnes
      where participant_id is not null), '[]'),
    'echanges', (select count(*) from echanges where etat = 'accepte'),
    'visites', jsonb_build_object(
      'debut', debut,
      'lien', (select count(*) from visites where etape = 'lien'),
      'ios', (select count(*) from visites where etape = 'lien' and plateforme = 'ios'),
      'android', (select count(*) from visites where etape = 'lien' and plateforme = 'android'),
      'ordi', (select count(*) from visites where etape = 'lien' and plateforme = 'ordi'),
      'appli', (select count(*) from visites where etape = 'appli'),
      'rappels', (select count(*) from rappels_abonnes where debut is not null and cree_le >= debut)
    )
  );
end $$;
revoke execute on function public.admin_lancement(text) from public;
grant execute on function public.admin_lancement(text) to anon, authenticated;
