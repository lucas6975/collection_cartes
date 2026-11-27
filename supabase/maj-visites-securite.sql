-- Team Ulysse : visites sécurité (pour l'instant Lucas, Vincent et l'administrateur).
-- Planning (dates, horaires, zones et pilotes de zone), inscriptions par rôle (membre EP,
-- salarié, prestataire / intérimaire, CODIR), écarts relevés avec photo, et rappels la veille et
-- le jour J aux seules personnes inscrites (fonction envoyer-rappels).
-- Le planning lui-même (noms) est importé directement dans Supabase, pas dans ce fichier.
-- À copier dans Supabase › SQL Editor › Run (peut être relancé).

create table if not exists public.visites_securite (
  id uuid primary key default gen_random_uuid(),
  date_visite date not null unique,
  horaire text not null default '14h00 à 15h00',
  -- [{ "pilote": "H.Bernard", "zones": "3N/ 4N/ Allée centrale/ …" }, …]
  zones jsonb not null default '[]'
);
alter table public.visites_securite enable row level security;
revoke all on public.visites_securite from anon, authenticated;

create table if not exists public.visite_secu_inscriptions (
  id uuid primary key default gen_random_uuid(),
  visite_id uuid not null references public.visites_securite (id) on delete cascade,
  role text not null check (role in ('ep', 'salarie', 'prestataire', 'codir')),
  nom text not null check (char_length(trim(nom)) between 2 and 80),
  participant_id uuid references public.participants (id) on delete set null,
  source text not null default 'appli',
  cree_le timestamptz not null default now(),
  rappel_veille_le timestamptz,
  rappel_jour_le timestamptz
);
create unique index if not exists visite_secu_inscriptions_unique
  on public.visite_secu_inscriptions (visite_id, role, lower(trim(nom)));
alter table public.visite_secu_inscriptions enable row level security;
revoke all on public.visite_secu_inscriptions from anon, authenticated;

create table if not exists public.visite_secu_ecarts (
  id uuid primary key default gen_random_uuid(),
  visite_id uuid not null references public.visites_securite (id) on delete cascade,
  numero int not null,
  zone text,
  description text not null check (char_length(trim(description)) between 1 and 1000),
  -- Photo compressée dans le téléphone (image JPEG en data URL, ~150 Ko).
  photo text check (photo is null or char_length(photo) < 1500000),
  statut text not null default 'a_traiter' check (statut in ('a_traiter', 'traite')),
  cree_par text,
  cree_le timestamptz not null default now()
);
create index if not exists visite_secu_ecarts_visite on public.visite_secu_ecarts (visite_id, numero);
alter table public.visite_secu_ecarts enable row level security;
revoke all on public.visite_secu_ecarts from anon, authenticated;

-- Inscrit Team Ulysse correspondant à un nom (prénom NOM ou NOM prénom, sans accents).
create or replace function public.participant_par_nom(p_nom text) returns uuid
language sql stable security definer set search_path = public as $$
  with n as (select translate(upper(trim(p_nom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ-', 'EEEEAAAIIOOUUUC ') as v)
  select p.id from participants p, n
  where translate(upper(trim(p.prenom) || ' ' || trim(p.nom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ-', 'EEEEAAAIIOOUUUC ') = n.v
     or translate(upper(trim(p.nom) || ' ' || trim(p.prenom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ-', 'EEEEAAAIIOOUUUC ') = n.v
  limit 1;
$$;
revoke execute on function public.participant_par_nom(text) from public, anon, authenticated;

-- Planning complet : visites, inscrits, nombre d'écarts.
create or replace function public.visites_planning(p_jeton uuid default null, p_code text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', v.id, 'date', v.date_visite, 'horaire', v.horaire, 'zones', v.zones,
      'inscrits', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'role', i.role,
          'nom', i.nom, 'appli', i.participant_id is not null) order by i.cree_le)
        from visite_secu_inscriptions i where i.visite_id = v.id), '[]'),
      'ecarts', (select count(*) from visite_secu_ecarts e where e.visite_id = v.id),
      'ecarts_a_traiter', (select count(*) from visite_secu_ecarts e where e.visite_id = v.id and e.statut = 'a_traiter')
    ) order by v.date_visite) from visites_securite v), '[]');
end $$;
revoke execute on function public.visites_planning(uuid, text) from public;
grant execute on function public.visites_planning(uuid, text) to anon, authenticated;

create or replace function public.visite_inscrire(
  p_visite uuid, p_role text, p_nom text, p_moi boolean default false,
  p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_participant uuid;
begin
  perform remontees_acces(p_jeton, p_code);
  if p_moi and p_jeton is not null then
    select id into v_participant from participants where jeton = p_jeton;
  else
    v_participant := participant_par_nom(p_nom);
  end if;
  insert into visite_secu_inscriptions (visite_id, role, nom, participant_id)
  values (p_visite, p_role, trim(p_nom), v_participant)
  on conflict do nothing;
end $$;
revoke execute on function public.visite_inscrire(uuid, text, text, boolean, uuid, text) from public;
grant execute on function public.visite_inscrire(uuid, text, text, boolean, uuid, text) to anon, authenticated;

create or replace function public.visite_desinscrire(
  p_inscription uuid, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  delete from visite_secu_inscriptions where id = p_inscription;
end $$;
revoke execute on function public.visite_desinscrire(uuid, uuid, text) from public;
grant execute on function public.visite_desinscrire(uuid, uuid, text) to anon, authenticated;

-- Écarts d'une visite (sans les photos, chargées une par une).
create or replace function public.visite_secu_ecarts_liste(
  p_visite uuid, p_jeton uuid default null, p_code text default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'numero', numero, 'zone', zone,
      'description', description, 'photo', photo is not null, 'statut', statut,
      'cree_par', cree_par, 'cree_le', cree_le) order by numero)
    from visite_secu_ecarts where visite_id = p_visite), '[]');
end $$;
revoke execute on function public.visite_secu_ecarts_liste(uuid, uuid, text) from public;
grant execute on function public.visite_secu_ecarts_liste(uuid, uuid, text) to anon, authenticated;

create or replace function public.visite_ecart_photo(
  p_ecart uuid, p_jeton uuid default null, p_code text default null
) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return (select photo from visite_secu_ecarts where id = p_ecart);
end $$;
revoke execute on function public.visite_ecart_photo(uuid, uuid, text) from public;
grant execute on function public.visite_ecart_photo(uuid, uuid, text) to anon, authenticated;

create or replace function public.visite_ecart_ajouter(
  p_visite uuid, p_zone text, p_description text, p_photo text, p_par text,
  p_jeton uuid default null, p_code text default null
) returns int
language plpgsql security definer set search_path = public as $$
declare v_numero int;
begin
  perform remontees_acces(p_jeton, p_code);
  perform pg_advisory_xact_lock(hashtext(p_visite::text));
  select coalesce(max(numero), 0) + 1 into v_numero from visite_secu_ecarts where visite_id = p_visite;
  insert into visite_secu_ecarts (visite_id, numero, zone, description, photo, cree_par)
  values (p_visite, v_numero, nullif(trim(p_zone), ''), trim(p_description), p_photo, nullif(trim(p_par), ''));
  return v_numero;
end $$;
revoke execute on function public.visite_ecart_ajouter(uuid, text, text, text, text, uuid, text) from public;
grant execute on function public.visite_ecart_ajouter(uuid, text, text, text, text, uuid, text) to anon, authenticated;

create or replace function public.visite_ecart_modifier(
  p_ecart uuid, p_statut text default null, p_supprimer boolean default false,
  p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  if p_supprimer then
    delete from visite_secu_ecarts where id = p_ecart;
  elsif p_statut is not null then
    update visite_secu_ecarts set statut = p_statut where id = p_ecart;
  end if;
end $$;
revoke execute on function public.visite_ecart_modifier(uuid, text, boolean, uuid, text) from public;
grant execute on function public.visite_ecart_modifier(uuid, text, boolean, uuid, text) to anon, authenticated;

-- Rappel de la veille : tous les jours vers 16 h (heure de Paris), la fonction envoyer-rappels
-- prévient les inscrits des visites du lendemain (le rappel du jour J part avec ceux du matin).
select cron.unschedule('team-ulysse-visites') where exists (select 1 from cron.job where jobname = 'team-ulysse-visites');
select cron.schedule('team-ulysse-visites', '0 15 * * *', $$
  select net.http_post(
    url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"visites": true}'::jsonb
  );
$$);
