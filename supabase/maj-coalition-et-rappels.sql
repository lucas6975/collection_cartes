-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : mise à jour de la base
--   1. Volontaires pour rejoindre la coalition Team Ulysse
--   2. Rappels sur les téléphones (pack du jour, case du calendrier)
--
-- À exécuter dans Supabase : SQL Editor › nouvel onglet VIDE › coller tout › Run.
-- Pour les rappels, créer d'abord la fonction « envoyer-rappels » (docs/NOTIFICATIONS.md).
-- Le script peut être relancé sans risque : il ne recrée pas ce qui existe déjà.
-- ════════════════════════════════════════════════════════════════════════════

-- ═════════════════════ 1. Coalition Team Ulysse ═════════════════════

create table if not exists public.volontaires (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 60),
  nom text not null check (char_length(nom) between 1 and 60),
  -- Lien avec l'inscription au calendrier, quand la personne en a une.
  participant_id uuid references public.participants (id) on delete set null,
  le timestamptz not null default now()
);
-- Une seule fois par personne (prénom + nom, sans tenir compte des majuscules).
create unique index if not exists volontaires_nom_unique on public.volontaires (lower(prenom), lower(nom));

alter table public.volontaires enable row level security;
revoke all on public.volontaires from anon, authenticated;

-- Un collaborateur dit « oui, je veux rejoindre la coalition ».
create or replace function public.rejoindre_coalition(p_prenom text, p_nom text, p_jeton uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_prenom text := nettoyer(p_prenom);
  v_nom text := nettoyer(p_nom);
  v_id uuid;
begin
  if char_length(v_prenom) = 0 or char_length(v_nom) = 0 then
    raise exception 'Prénom et nom obligatoires' using errcode = '22023';
  end if;
  insert into volontaires (prenom, nom, participant_id)
  values (v_prenom, v_nom, (select id from participants where jeton = p_jeton))
  on conflict ((lower(prenom)), (lower(nom))) do nothing
  returning id into v_id;
  return jsonb_build_object('deja', v_id is null);
end $$;

-- Administrateur : la liste des volontaires.
create or replace function public.admin_volontaires(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'prenom', prenom, 'nom', nom, 'participant_id', participant_id, 'le', le)
      order by le desc)
    from volontaires), '[]');
end $$;

-- Administrateur : retirer quelqu'un de la liste (doublon, erreur…).
create or replace function public.admin_supprimer_volontaire(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  delete from volontaires where id = p_id;
end $$;

revoke execute on function public.rejoindre_coalition(text, text, uuid),
  public.admin_volontaires(text), public.admin_supprimer_volontaire(text, uuid)
  from public;
grant execute on function public.rejoindre_coalition(text, text, uuid) to anon, authenticated;
grant execute on function public.admin_volontaires(text) to anon, authenticated;
grant execute on function public.admin_supprimer_volontaire(text, uuid) to anon, authenticated;

-- ═════════════════════ 2. Rappels sur les téléphones ═════════════════════

-- Téléphones qui ont accepté les rappels (aucune donnée personnelle obligatoire).
create table if not exists public.rappels_abonnes (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) < 1000),
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  pack boolean not null default true,
  avent boolean not null default true,
  participant_id uuid references public.participants (id) on delete set null,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

-- Journal des envois : un seul envoi par rappel et par jour.
create table if not exists public.rappels_envois (
  type text not null check (type in ('pack', 'avent')),
  jour date not null,
  envoyes int,
  le timestamptz not null default now(),
  primary key (type, jour)
);

alter table public.rappels_abonnes enable row level security;
alter table public.rappels_envois enable row level security;
revoke all on public.rappels_abonnes, public.rappels_envois from anon, authenticated;

-- Le téléphone enregistre (ou met à jour) ses rappels.
create or replace function public.enregistrer_rappels(
  p_endpoint text, p_p256dh text, p_auth text, p_pack boolean, p_avent boolean,
  p_jeton uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (coalesce(p_pack, false) or coalesce(p_avent, false)) then
    delete from rappels_abonnes where endpoint = p_endpoint;
    return;
  end if;
  insert into rappels_abonnes (endpoint, p256dh, auth, pack, avent, participant_id)
  values (p_endpoint, p_p256dh, p_auth, coalesce(p_pack, false), coalesce(p_avent, false),
          (select id from participants where jeton = p_jeton))
  on conflict (endpoint) do update set
    p256dh = excluded.p256dh, auth = excluded.auth, pack = excluded.pack, avent = excluded.avent,
    participant_id = coalesce(excluded.participant_id, rappels_abonnes.participant_id),
    modifie_le = now();
end $$;

-- Le téléphone ne veut plus de rappels.
create or replace function public.supprimer_rappels(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from rappels_abonnes where endpoint = p_endpoint
$$;

grant execute on function public.enregistrer_rappels, public.supprimer_rappels to anon, authenticated;

-- Pour l'administrateur : nombre de téléphones abonnés (code administrateur exigé).
create or replace function public.admin_rappels(p_code text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform verifier_code(p_code);
  return jsonb_build_object(
    'pack', (select count(*) from rappels_abonnes where pack),
    'avent', (select count(*) from rappels_abonnes where avent)
  );
end $$;
grant execute on function public.admin_rappels to anon, authenticated;

-- ───────────── Tâche programmée ─────────────
-- Appelle la fonction « envoyer-rappels » du lundi au vendredi à 5 h 30, 6 h 30 et 7 h 30 UTC.
-- La fonction calcule elle-même l'heure de Paris et n'envoie que le bon rappel au bon moment
-- (été comme hiver), une seule fois par jour.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'team-ulysse-rappels',
  '30 5,6,7 * * 1-5',
  $$ select net.http_post(
       url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
