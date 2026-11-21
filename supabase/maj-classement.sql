-- Team Ulysse : classement des collectionneurs, visible par tous les inscrits.
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).
-- Nécessite l'onglet Packs (table packs_suivi), déjà en place.

alter table public.packs_suivi add column if not exists legendaires int not null default 0;
-- Téléphone administrateur (cartes de test) : jamais dans le classement.
alter table public.packs_suivi add column if not exists hors_classement boolean not null default false;
-- La personne a choisi « masquer mon nom » : elle apparaît en « Joueur anonyme ».
alter table public.packs_suivi add column if not exists masque boolean not null default false;

-- Nouvelle version : envoie aussi les légendaires, le choix « masquer mon nom » et le statut admin.
drop function if exists public.envoyer_packs(uuid, jsonb, int);
create or replace function public.envoyer_packs(
  p_jeton uuid, p_packs jsonb, p_cartes int,
  p_legendaires int default 0, p_admin boolean default false, p_masque boolean default false
) returns void
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := (select id from participants where jeton = p_jeton);
begin
  if pid is null then return; end if;
  if jsonb_typeof(p_packs) <> 'array' or jsonb_array_length(p_packs) > 1000 then
    raise exception 'Historique invalide';
  end if;
  insert into packs_suivi (participant_id, packs, cartes, legendaires, hors_classement, masque, vu_le)
  values (pid, p_packs, greatest(0, least(coalesce(p_cartes, 0), 1000)),
          greatest(0, least(coalesce(p_legendaires, 0), 1000)),
          coalesce(p_admin, false), coalesce(p_masque, false), now())
  on conflict (participant_id) do update set
    packs = excluded.packs, cartes = excluded.cartes, legendaires = excluded.legendaires,
    hors_classement = excluded.hors_classement, masque = excluded.masque, vu_le = now();
end $$;
revoke execute on function public.envoyer_packs(uuid, jsonb, int, int, boolean, boolean) from public;
grant execute on function public.envoyer_packs(uuid, jsonb, int, int, boolean, boolean) to anon, authenticated;

-- Le classement : prénom + initiale du nom (ou « Joueur anonyme »), cartes, légendaires, échanges.
-- Réservé aux inscrits (jeton) et à l'administrateur (code). Aucun identifiant n'est renvoyé.
drop function if exists public.classement(uuid);
create or replace function public.classement(p_jeton uuid default null, p_code text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  moi uuid := (select id from participants where jeton = p_jeton);
begin
  if moi is null then
    if p_code is null then raise exception 'Inscris-toi pour voir le classement'; end if;
    perform verifier_code(p_code);
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'cle', substr(md5(p.id::text), 1, 10),
      'prenom', case when s.masque then 'Joueur' else p.prenom end,
      'nom', case when s.masque then 'anonyme' else upper(left(p.nom, 1)) || '.' end,
      'cartes', s.cartes,
      'legendaires', s.legendaires,
      'echanges', (select count(*) from echanges e where e.etat = 'accepte'
                    and (lower(e.nom_a) = lower(p.prenom || ' ' || p.nom)
                      or lower(e.nom_b) = lower(p.prenom || ' ' || p.nom))),
      'moi', p.id is not distinct from moi
    ) order by s.cartes desc, s.legendaires desc, p.inscrit_le)
    from packs_suivi s join participants p on p.id = s.participant_id
    where not s.hors_classement and s.cartes > 0), '[]');
end $$;
revoke execute on function public.classement(uuid, text) from public;
grant execute on function public.classement(uuid, text) to anon, authenticated;
