-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : rappels sur les téléphones (notifications)
--   · « Pack du jour disponible » : du lundi au vendredi, 8 h 30
--   · « Case du jour à ouvrir »   : calendrier de l'Avent, jours ouvrés du 1er au 24 déc., 7 h 30
--
-- À exécuter UNE fois dans Supabase (SQL Editor › nouvel onglet vide › coller › Run),
-- APRÈS avoir créé la fonction « envoyer-rappels » (voir docs/NOTIFICATIONS.md).
-- ════════════════════════════════════════════════════════════════════════════

-- Téléphones qui ont accepté les rappels (aucune donnée personnelle obligatoire).
create table public.rappels_abonnes (
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
create table public.rappels_envois (
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
create function public.enregistrer_rappels(
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
create function public.supprimer_rappels(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from rappels_abonnes where endpoint = p_endpoint
$$;

grant execute on function public.enregistrer_rappels, public.supprimer_rappels to anon, authenticated;

-- Pour l'administrateur : nombre de téléphones abonnés (code administrateur exigé).
create function public.admin_rappels(p_code text) returns jsonb
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
