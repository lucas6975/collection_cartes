-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : inscriptions au calendrier de l'Avent et tirages au sort
--
-- À exécuter UNE fois dans Supabase : SQL Editor › New query › coller › Run.
-- AVANT d'exécuter : remplace CHOISIS-TON-CODE (tout en bas) par ton code administrateur.
--
-- Sécurité : les tables ne sont pas accessibles directement depuis le site. Tout passe par
-- les fonctions ci-dessous. Lire la liste des inscrits ou lancer un tirage exige le code
-- administrateur, vérifié par la base (il n'est stocké que sous forme chiffrée).
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 60),
  nom text not null check (char_length(nom) between 1 and 60),
  -- Jours de décembre auxquels la personne s'inscrit (1 à 24).
  jours int[] not null default '{}' check (jours <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]),
  -- Jeton secret gardé par le téléphone de la personne, pour modifier son inscription.
  jeton uuid not null default gen_random_uuid() unique,
  inscrit_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
-- Une seule inscription par personne (prénom + nom, sans tenir compte des majuscules).
create unique index participants_nom_unique on public.participants (lower(prenom), lower(nom));

create table public.tirages (
  jour int primary key check (jour between 1 and 24),
  participant_id uuid references public.participants (id) on delete set null,
  prenom text not null,
  nom text not null,
  tire_le timestamptz not null default now()
);

create table public.admin_config (
  id boolean primary key default true check (id),
  code_hash text not null
);

-- Aucun accès direct aux tables depuis le site : seules les fonctions ci-dessous sont utilisables.
alter table public.participants enable row level security;
alter table public.tirages enable row level security;
alter table public.admin_config enable row level security;
revoke all on public.participants, public.tirages, public.admin_config from anon, authenticated;

-- ───────────── Fonctions internes ─────────────

create function public.verifier_code(p_code text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from admin_config where code_hash = crypt(coalesce(p_code, ''), code_hash)) then
    perform pg_sleep(1); -- ralentit les tentatives au hasard
    raise exception 'Code administrateur incorrect' using errcode = '28000';
  end if;
end $$;

create function public.nettoyer(p text) returns text
language sql immutable as $$ select regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g') $$;

create function public.jours_valides(p int[]) returns int[]
language sql immutable as $$
  select coalesce(array_agg(distinct j order by j), '{}') from unnest(coalesce(p, '{}')) j where j between 1 and 24
$$;

-- ───────────── Fonctions publiques (collaborateurs) ─────────────

-- Inscription ou mise à jour. Renvoie le jeton à conserver sur le téléphone.
create function public.inscrire(p_prenom text, p_nom text, p_jours int[], p_jeton uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_prenom text := nettoyer(p_prenom);
  v_nom text := nettoyer(p_nom);
  v_jours int[] := jours_valides(p_jours);
  r participants;
begin
  if char_length(v_prenom) = 0 or char_length(v_nom) = 0 then
    raise exception 'Prénom et nom obligatoires' using errcode = '22023';
  end if;
  if char_length(v_prenom) > 60 or char_length(v_nom) > 60 then
    raise exception 'Prénom ou nom trop long' using errcode = '22023';
  end if;

  -- Le téléphone a déjà une inscription : on la met à jour.
  if p_jeton is not null then
    update participants set prenom = v_prenom, nom = v_nom, jours = v_jours, modifie_le = now()
    where jeton = p_jeton returning * into r;
  end if;

  if r.id is null then
    -- Même personne déjà inscrite depuis un autre téléphone : on ajoute ses jours.
    update participants set jours = jours_valides(jours || v_jours), modifie_le = now()
    where lower(prenom) = lower(v_prenom) and lower(nom) = lower(v_nom) returning * into r;
  end if;

  if r.id is null then
    insert into participants (prenom, nom, jours) values (v_prenom, v_nom, v_jours) returning * into r;
  end if;

  return jsonb_build_object('id', r.id, 'jeton', r.jeton, 'prenom', r.prenom, 'nom', r.nom, 'jours', to_jsonb(r.jours));
end $$;

-- Ce que voit un collaborateur : son inscription et s'il a été tiré au sort.
create function public.ma_participation(p_jeton uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'prenom', p.prenom, 'nom', p.nom, 'jours', to_jsonb(p.jours),
    'gagne', (select jsonb_agg(t.jour order by t.jour) from tirages t where t.participant_id = p.id)
  )
  from participants p where p.jeton = p_jeton
$$;

-- ───────────── Fonctions administrateur (code obligatoire) ─────────────

create function public.admin_verifier(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return true;
end $$;

create function public.admin_liste(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return jsonb_build_object(
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'prenom', prenom, 'nom', nom, 'jours', to_jsonb(jours), 'inscrit_le', inscrit_le)
        order by lower(nom), lower(prenom))
      from participants), '[]'),
    'tirages', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'participant_id', participant_id, 'prenom', prenom, 'nom', nom, 'tire_le', tire_le)
        order by jour)
      from tirages), '[]')
  );
end $$;

-- Tire au sort un gagnant parmi les inscrits du jour qui n'ont encore jamais gagné.
-- p_refaire = true annule le tirage existant de ce jour et en refait un.
create function public.admin_tirer(p_code text, p_jour int, p_refaire boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g participants;
begin
  perform verifier_code(p_code);
  if p_jour not between 1 and 24 then
    raise exception 'Jour invalide' using errcode = '22023';
  end if;
  if exists (select 1 from tirages where jour = p_jour) then
    if not p_refaire then
      raise exception 'Le tirage de ce jour a déjà été fait' using errcode = 'P0001';
    end if;
    delete from tirages where jour = p_jour;
  end if;

  select * into g from participants
  where p_jour = any (jours)
    and id not in (select participant_id from tirages where participant_id is not null)
  order by random() limit 1;

  if g.id is null then
    raise exception 'Aucun participant disponible pour ce jour' using errcode = 'P0002';
  end if;

  insert into tirages (jour, participant_id, prenom, nom) values (p_jour, g.id, g.prenom, g.nom);
  return jsonb_build_object('jour', p_jour, 'participant_id', g.id, 'prenom', g.prenom, 'nom', g.nom);
end $$;

create function public.admin_annuler_tirage(p_code text, p_jour int) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  delete from tirages where jour = p_jour;
end $$;

create function public.admin_supprimer(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  delete from participants where id = p_id;
end $$;

-- Droits : le site (rôle « anon ») ne peut appeler que les fonctions publiques et administrateur.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.inscrire(text, text, int[], uuid) to anon, authenticated;
grant execute on function public.ma_participation(uuid) to anon, authenticated;
grant execute on function public.admin_verifier(text) to anon, authenticated;
grant execute on function public.admin_liste(text) to anon, authenticated;
grant execute on function public.admin_tirer(text, int, boolean) to anon, authenticated;
grant execute on function public.admin_annuler_tirage(text, int) to anon, authenticated;
grant execute on function public.admin_supprimer(text, uuid) to anon, authenticated;

-- ═════════ Ton code administrateur : remplace CHOISIS-TON-CODE avant d'exécuter ═════════
insert into public.admin_config (code_hash) values (extensions.crypt('CHOISIS-TON-CODE', extensions.gen_salt('bf')));
