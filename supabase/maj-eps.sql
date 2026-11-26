-- Team Ulysse : Échange Périodique de Sécurité (EPS) dans l'Espace Sécurité.
-- Formulaire d'interview, liste des EPS (pas de nouvelle interview de la même personne avant
-- 2 mois), annuaire pour choisir les noms, statistiques (courbe de Bradley).
-- Accès : administrateur (code) ou destinataires des remontées (jeton), comme l'Espace Sécurité.
-- Les noms (annuaire, EPS déjà faites) sont ajoutés directement dans Supabase, pas dans ce fichier.
-- À copier dans Supabase › SQL Editor › Run (peut être relancé).

create table if not exists public.eps (
  id uuid primary key default gen_random_uuid(),
  interviewe text not null check (char_length(trim(interviewe)) between 1 and 80),
  cle text not null,
  interviewer text not null check (char_length(trim(interviewer)) between 1 and 80),
  manager text,
  correspondant text,
  service text,
  secteur text,
  date_eps date not null,
  reponses jsonb,
  niveaux int[],
  score numeric(4, 3),
  niveau int check (niveau between 1 and 4),
  source text not null default 'appli',
  cree_le timestamptz not null default now()
);
create index if not exists eps_cle_idx on public.eps (cle, date_eps);
alter table public.eps enable row level security;
revoke all on public.eps from anon, authenticated;

create table if not exists public.eps_annuaire (
  nom text primary key,
  service text,
  manager boolean not null default false
);
alter table public.eps_annuaire enable row level security;
revoke all on public.eps_annuaire from anon, authenticated;

create table if not exists public.eps_volontaires (
  nom text primary key,
  ajoute_le timestamptz not null default now()
);
alter table public.eps_volontaires enable row level security;
revoke all on public.eps_volontaires from anon, authenticated;

-- Tout ce qu'il faut à l'onglet EPS en un appel.
create or replace function public.eps_donnees(p_jeton uuid default null, p_code text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return jsonb_build_object(
    'eps', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'interviewe', interviewe, 'cle', cle, 'interviewer', interviewer,
        'manager', manager, 'correspondant', correspondant, 'service', service,
        'secteur', secteur, 'date', date_eps, 'reponses', reponses, 'niveaux', niveaux,
        'score', score, 'niveau', niveau, 'source', source
      ) order by date_eps desc, cree_le desc) from eps), '[]'),
    'annuaire', coalesce((select jsonb_agg(jsonb_build_object(
        'nom', nom, 'service', service, 'manager', manager) order by nom) from eps_annuaire), '[]'),
    'volontaires', coalesce((select jsonb_agg(nom order by ajoute_le) from eps_volontaires), '[]'),
    'inscrits', (select count(*) from participants)
  );
end $$;
revoke execute on function public.eps_donnees(uuid, text) from public;
grant execute on function public.eps_donnees(uuid, text) to anon, authenticated;

-- Enregistrer une EPS. Refusée si la même personne a déjà été interviewée il y a moins de 2 mois.
create or replace function public.eps_enregistrer(
  p_eps jsonb, p_jeton uuid default null, p_code text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_date date := (p_eps->>'date')::date;
  v_cle text := upper(trim(p_eps->>'cle'));
  v_avant date;
  v_id uuid;
begin
  perform remontees_acces(p_jeton, p_code);
  if v_cle = '' or v_date is null then
    raise exception 'EPS incomplète' using errcode = '22023';
  end if;
  select max(date_eps) into v_avant from eps
  where (cle = v_cle
         or (position('.' in cle) = 0 and cle = split_part(v_cle, '.', 2))
         or (position('.' in v_cle) = 0 and split_part(cle, '.', 2) = v_cle))
    and date_eps > v_date - interval '2 months' and date_eps <= v_date + interval '2 months';
  if v_avant is not null then
    raise exception 'Déjà interviewé(e) le % : attendre 2 mois', to_char(v_avant, 'DD/MM/YYYY')
      using errcode = '23505';
  end if;
  insert into eps (interviewe, cle, interviewer, manager, correspondant, service, secteur,
                   date_eps, reponses, niveaux, score, niveau)
  values (trim(p_eps->>'interviewe'), v_cle, trim(p_eps->>'interviewer'),
          nullif(trim(p_eps->>'manager'), ''), nullif(trim(p_eps->>'correspondant'), ''),
          nullif(trim(p_eps->>'service'), ''), nullif(trim(p_eps->>'secteur'), ''),
          v_date, p_eps->'reponses',
          array(select jsonb_array_elements_text(p_eps->'niveaux')::int),
          (p_eps->>'score')::numeric, (p_eps->>'niveau')::int)
  returning id into v_id;
  delete from eps_volontaires where upper(nom) = upper(trim(p_eps->>'interviewe'));
  return v_id;
end $$;
revoke execute on function public.eps_enregistrer(jsonb, uuid, text) from public;
grant execute on function public.eps_enregistrer(jsonb, uuid, text) to anon, authenticated;

-- Supprimer une EPS saisie par erreur (administrateur uniquement).
create or replace function public.eps_supprimer(p_id uuid, p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  delete from eps where id = p_id;
end $$;
revoke execute on function public.eps_supprimer(uuid, text) from public;
grant execute on function public.eps_supprimer(uuid, text) to anon, authenticated;
