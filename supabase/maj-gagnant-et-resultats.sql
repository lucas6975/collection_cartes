-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : mise à jour de la base
--   1. Notification à la personne tirée au sort
--   2. Résultats des défis du calendrier, visibles par l'administrateur
--
-- À exécuter dans Supabase : SQL Editor › nouvel onglet VIDE › coller tout › Run.
-- Puis remettre à jour la fonction « envoyer-rappels » (docs/NOTIFICATIONS.md).
-- Le script peut être relancé sans risque.
-- ════════════════════════════════════════════════════════════════════════════

-- ═════════════════════ 1. Notification à la personne tirée au sort ═════════════════════
-- À chaque tirage (espace administrateur), la personne tirée au sort est mise en attente ici,
-- puis la fonction « envoyer-rappels » lui envoie une notification sur ses téléphones :
--   « 🎁 Tu as été tiré(e) au sort ! C'est toi le gagnant du N décembre… »
-- En décembre, le message part le jour même du tirage, jamais en avance.
-- Seules les personnes qui ont activé les rappels peuvent être prévenues.

create extension if not exists pg_net with schema extensions;

create table if not exists public.notifs_gagnants (
  jour int primary key check (jour between 1 and 24),
  participant_id uuid not null references public.participants (id) on delete cascade,
  envoye_le timestamptz
);
alter table public.notifs_gagnants enable row level security;
revoke all on public.notifs_gagnants from anon, authenticated;

-- Appelée après chaque tirage (ou annulation) : met la personne en attente et réveille la fonction.
create or replace function public.tirage_a_notifier() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then
    delete from notifs_gagnants where jour = old.jour and envoye_le is null;
    return old;
  end if;
  if new.participant_id is null then
    return new;
  end if;
  insert into notifs_gagnants (jour, participant_id) values (new.jour, new.participant_id)
  on conflict (jour) do update set participant_id = excluded.participant_id, envoye_le = null;
  perform net.http_post(
    url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"gagnants": true}'::jsonb
  );
  return new;
end $$;

drop trigger if exists tirage_notif on public.tirages;
create trigger tirage_notif after insert or delete on public.tirages
for each row execute function public.tirage_a_notifier();

-- ═════════════════════ 2. Résultats des défis du calendrier ═════════════════════
-- Quand un collaborateur termine la case d'un jour, l'appli envoie son résultat (étoiles et
-- détail de chaque jeu). On garde le premier résultat et le meilleur : l'administrateur voit si
-- la personne tirée au sort a réussi le défi, pour lui remettre (ou non) son cadeau.

create table if not exists public.resultats_avent (
  participant_id uuid not null references public.participants (id) on delete cascade,
  jour int not null check (jour between 1 and 24),
  premier_etoiles int not null check (premier_etoiles between 0 and 3),
  premier_le timestamptz not null default now(),
  etoiles int not null check (etoiles between 0 and 3),
  details jsonb not null default '[]',
  maj_le timestamptz not null default now(),
  primary key (participant_id, jour)
);
alter table public.resultats_avent enable row level security;
revoke all on public.resultats_avent from anon, authenticated;

-- Le téléphone envoie le résultat d'une case (identifié par le jeton de son inscription).
create or replace function public.envoyer_resultat(p_jeton uuid, p_jour int, p_etoiles int, p_details jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (select id from participants where jeton = p_jeton);
begin
  if v_id is null then
    raise exception 'Inscription introuvable' using errcode = '22023';
  end if;
  if p_jour not between 1 and 24 or p_etoiles not between 0 and 3 then
    raise exception 'Résultat invalide' using errcode = '22023';
  end if;
  if octet_length(coalesce(p_details, '[]')::text) > 4000 then
    raise exception 'Résultat trop long' using errcode = '22023';
  end if;
  insert into resultats_avent (participant_id, jour, premier_etoiles, etoiles, details)
  values (v_id, p_jour, p_etoiles, p_etoiles, coalesce(p_details, '[]'))
  on conflict (participant_id, jour) do update set
    etoiles = greatest(resultats_avent.etoiles, excluded.etoiles),
    details = case when excluded.etoiles >= resultats_avent.etoiles then excluded.details else resultats_avent.details end,
    maj_le = now();
end $$;

-- Pour l'administrateur : les résultats de tout le monde, jour par jour (code administrateur exigé).
create or replace function public.admin_resultats(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'jour', r.jour, 'participant_id', r.participant_id, 'prenom', p.prenom, 'nom', p.nom,
      'premier_etoiles', r.premier_etoiles, 'premier_le', r.premier_le,
      'etoiles', r.etoiles, 'details', r.details, 'maj_le', r.maj_le)
      order by r.jour, r.etoiles desc, r.premier_le)
    from resultats_avent r join participants p on p.id = r.participant_id), '[]');
end $$;

revoke execute on function public.envoyer_resultat(uuid, int, int, jsonb), public.admin_resultats(text) from public;
grant execute on function public.envoyer_resultat(uuid, int, int, jsonb) to anon, authenticated;
grant execute on function public.admin_resultats(text) to anon, authenticated;
