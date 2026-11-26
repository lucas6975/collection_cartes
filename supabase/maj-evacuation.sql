-- Team Ulysse : recensement au point de rassemblement pendant une évacuation.
-- Lucas, Vincent (destinataires des remontées) ou l'administrateur lancent l'évacuation ; chacun
-- se déclare présent en scannant le QR (même sans l'appli) ou depuis le bandeau de l'appli.
-- Les comptes des inscrits ne sont jamais modifiés.
-- À copier dans Supabase › SQL Editor › Run (peut être relancé).

create table if not exists public.evacuations (
  id uuid primary key default gen_random_uuid(),
  debut timestamptz not null default now(),
  fin timestamptz,
  lance_par text,
  -- Nombre de personnes sur la liste d'appel imprimée (poste de garde), saisi pour comparer.
  effectif_liste int
);
alter table public.evacuations enable row level security;
revoke all on public.evacuations from anon, authenticated;

create table if not exists public.evacuation_presents (
  id uuid primary key default gen_random_uuid(),
  evacuation_id uuid not null references public.evacuations (id) on delete cascade,
  prenom text not null check (char_length(trim(prenom)) between 1 and 60),
  nom text not null check (char_length(trim(nom)) between 1 and 60),
  statut text not null default 'Salarié IMECA',
  societe text,
  participant_id uuid references public.participants (id) on delete set null,
  appareil text,
  ajoute_par text not null default 'qr',
  pointe boolean not null default false,
  cree_le timestamptz not null default now()
);
create unique index if not exists evacuation_presents_nom
  on public.evacuation_presents (evacuation_id, lower(trim(prenom)), lower(trim(nom)));
alter table public.evacuation_presents enable row level security;
revoke all on public.evacuation_presents from anon, authenticated;

-- Évacuation en cours (au plus une ; oubliée au bout de 12 h si personne ne l'a terminée).
create or replace function public.evacuation_active() returns uuid
language sql stable security definer set search_path = public as $$
  select id from evacuations
  where fin is null and debut > now() - interval '12 hours'
  order by debut desc limit 1;
$$;
revoke execute on function public.evacuation_active() from public, anon, authenticated;

-- Pour tous (page du QR, bandeau de l'appli) : y a-t-il une évacuation en cours ?
create or replace function public.rassemblement_etat() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('active', e.id is not null, 'id', e.id, 'debut', e.debut)
  from (select evacuation_active() as id) a left join evacuations e on e.id = a.id;
$$;
revoke execute on function public.rassemblement_etat() from public;
grant execute on function public.rassemblement_etat() to anon, authenticated;

-- Pour tous : « je suis présent(e) ». Un même prénom + nom n'est compté qu'une fois.
create or replace function public.rassemblement_present(
  p_prenom text, p_nom text, p_statut text default 'Salarié IMECA', p_societe text default null,
  p_appareil text default null, p_jeton uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_evac uuid := evacuation_active();
  v_participant uuid;
  v_id uuid;
  v_heure timestamptz;
begin
  if v_evac is null then
    raise exception 'Aucune évacuation en cours' using errcode = 'P0002';
  end if;
  if p_jeton is not null then
    select id into v_participant from participants where jeton = p_jeton;
  end if;
  -- Même prénom et même nom : déjà compté (un téléphone peut enregistrer plusieurs personnes).
  select id, cree_le into v_id, v_heure from evacuation_presents
  where evacuation_id = v_evac
    and lower(trim(prenom)) = lower(trim(p_prenom)) and lower(trim(nom)) = lower(trim(p_nom));
  if v_id is not null then
    update evacuation_presents set prenom = trim(p_prenom), nom = trim(p_nom),
      statut = left(coalesce(p_statut, statut), 40), societe = nullif(trim(p_societe), ''),
      participant_id = coalesce(v_participant, participant_id)
    where id = v_id;
    return jsonb_build_object('deja', true, 'heure', v_heure);
  end if;
  insert into evacuation_presents (evacuation_id, prenom, nom, statut, societe, participant_id, appareil)
  values (v_evac, trim(p_prenom), trim(p_nom), left(coalesce(p_statut, 'Salarié IMECA'), 40),
          nullif(trim(p_societe), ''), v_participant, p_appareil)
  returning cree_le into v_heure;
  return jsonb_build_object('deja', false, 'heure', v_heure);
end $$;
revoke execute on function public.rassemblement_present(text, text, text, text, text, uuid) from public;
grant execute on function public.rassemblement_present(text, text, text, text, text, uuid) to anon, authenticated;

-- ── Gestion (Lucas, Vincent, administrateur) ──

create or replace function public.evacuation_demarrer(
  p_par text default null, p_jeton uuid default null, p_code text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid := evacuation_active();
begin
  perform remontees_acces(p_jeton, p_code);
  if v_id is not null then return v_id; end if;
  insert into evacuations (lance_par) values (nullif(trim(p_par), '')) returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.evacuation_demarrer(text, uuid, text) from public;
grant execute on function public.evacuation_demarrer(text, uuid, text) to anon, authenticated;

create or replace function public.evacuation_terminer(
  p_id uuid, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  update evacuations set fin = now() where id = p_id and fin is null;
end $$;
revoke execute on function public.evacuation_terminer(uuid, uuid, text) from public;
grant execute on function public.evacuation_terminer(uuid, uuid, text) to anon, authenticated;

-- Suivi : l'évacuation demandée (ou celle en cours), ses présents, et l'historique.
create or replace function public.evacuation_suivi(
  p_id uuid default null, p_jeton uuid default null, p_code text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := coalesce(p_id, evacuation_active());
begin
  perform remontees_acces(p_jeton, p_code);
  return jsonb_build_object(
    'active', evacuation_active(),
    'evacuation', (select jsonb_build_object('id', id, 'debut', debut, 'fin', fin,
        'lance_par', lance_par, 'effectif_liste', effectif_liste) from evacuations where id = v_id),
    'presents', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'prenom', prenom, 'nom', nom, 'statut', statut, 'societe', societe,
        'appli', participant_id is not null, 'ajoute_par', ajoute_par, 'pointe', pointe,
        'heure', cree_le) order by upper(nom), upper(prenom))
      from evacuation_presents where evacuation_id = v_id), '[]'),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'debut', e.debut,
        'fin', e.fin, 'total', (select count(*) from evacuation_presents p where p.evacuation_id = e.id))
        order by e.debut desc) from (select * from evacuations order by debut desc limit 30) e), '[]')
  );
end $$;
revoke execute on function public.evacuation_suivi(uuid, uuid, text) from public;
grant execute on function public.evacuation_suivi(uuid, uuid, text) to anon, authenticated;

-- Ajout à la main (personne sans téléphone).
create or replace function public.evacuation_ajouter(
  p_id uuid, p_prenom text, p_nom text, p_statut text, p_societe text default null,
  p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  insert into evacuation_presents (evacuation_id, prenom, nom, statut, societe, ajoute_par)
  values (p_id, trim(p_prenom), trim(p_nom), left(p_statut, 40), nullif(trim(p_societe), ''), 'manuel')
  on conflict do nothing;
end $$;
revoke execute on function public.evacuation_ajouter(uuid, text, text, text, text, uuid, text) from public;
grant execute on function public.evacuation_ajouter(uuid, text, text, text, text, uuid, text) to anon, authenticated;

-- Pointage avec la liste d'appel imprimée, retrait d'une erreur, effectif de la liste.
create or replace function public.evacuation_pointer(
  p_present uuid, p_pointe boolean, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  update evacuation_presents set pointe = p_pointe where id = p_present;
end $$;
revoke execute on function public.evacuation_pointer(uuid, boolean, uuid, text) from public;
grant execute on function public.evacuation_pointer(uuid, boolean, uuid, text) to anon, authenticated;

create or replace function public.evacuation_retirer(
  p_present uuid, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  delete from evacuation_presents where id = p_present;
end $$;
revoke execute on function public.evacuation_retirer(uuid, uuid, text) from public;
grant execute on function public.evacuation_retirer(uuid, uuid, text) to anon, authenticated;

create or replace function public.evacuation_effectif(
  p_id uuid, p_effectif int, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  update evacuations set effectif_liste = p_effectif where id = p_id;
end $$;
revoke execute on function public.evacuation_effectif(uuid, int, uuid, text) from public;
grant execute on function public.evacuation_effectif(uuid, int, uuid, text) to anon, authenticated;

-- Supprimer une évacuation d'exercice ou de test.
create or replace function public.evacuation_supprimer(
  p_id uuid, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  delete from evacuations where id = p_id;
end $$;
revoke execute on function public.evacuation_supprimer(uuid, uuid, text) from public;
grant execute on function public.evacuation_supprimer(uuid, uuid, text) to anon, authenticated;
