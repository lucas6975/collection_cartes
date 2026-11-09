-- ════════════════════════════════════════════════════════════════════════════
-- Vigie : schéma de base de données (Supabase / PostgreSQL)
--
-- Principe anti-triche : les tables de progression ne sont JAMAIS modifiables
-- directement par un client. Le navigateur appelle des fonctions (RPC) qui
-- corrigent les réponses côté serveur et attribuent XP, cartes et succès selon
-- les mêmes règles que src/domain/engine.ts.
-- ════════════════════════════════════════════════════════════════════════════

create type public.category_id as enum ('incendie', 'epi', 'risques', 'postures', 'organisation');
create type public.rarity as enum ('commune', 'peu-commune', 'rare', 'epique', 'legendaire');
create type public.nature as enum ('obligation', 'norme', 'recommandation', 'pratique-interne');
create type public.verif_statut as enum ('a-verifier', 'valide');
create type public.user_role as enum ('collaborateur', 'admin');

-- ───────────── Comptes ─────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null,
  nom text not null,
  email text not null unique,
  equipe text not null default '',
  service text not null default '',
  role public.user_role not null default 'collaborateur',
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and actif);
$$;

-- ───────────── Contenus pédagogiques ─────────────
-- Colonnes communes de traçabilité : nature, sources, vérification, publication.

create table public.cards (
  id text primary key,
  numero int not null unique check (numero > 0),
  nom text not null,
  categorie public.category_id not null,
  rarete public.rarity not null,
  icone text not null default 'ShieldCheck',
  image_url text,
  description text not null,
  info text not null default '',
  le_savais_tu text not null default '',
  a_retenir text not null,
  -- {"type":"maitrise","seuil":3} | {"type":"parcours","parcoursId":"…"} | {"type":"scenario","scenarioId":"…"}
  -- | {"type":"collection"} | {"type":"niveau","niveau":5}
  obtention jsonb not null,
  nature public.nature not null,
  sources jsonb not null default '[]',
  verif_statut public.verif_statut not null default 'a-verifier',
  verif_date date,
  verif_par text,
  publie boolean not null default false
);

create table public.questions (
  id text primary key,
  categorie public.category_id not null,
  difficulte smallint not null check (difficulte between 1 and 3),
  enonce text not null,
  choix jsonb not null, -- [{"id":"a","texte":"…"}]
  bonne_reponse text not null,
  explication text not null,
  nature public.nature not null,
  sources jsonb not null default '[]',
  verif_statut public.verif_statut not null default 'a-verifier',
  verif_date date,
  verif_par text,
  publie boolean not null default false
);

create table public.scenarios (
  id text primary key,
  categorie public.category_id not null,
  titre text not null,
  accroche text not null default '',
  lieu text not null default '',
  etapes jsonb not null, -- [{"id","situation","options":[{"id","texte","correct","consequence"}]}]
  nature public.nature not null,
  sources jsonb not null default '[]',
  verif_statut public.verif_statut not null default 'a-verifier',
  verif_date date,
  verif_par text,
  publie boolean not null default false
);

create table public.parcours (
  id text primary key,
  categorie public.category_id not null,
  titre text not null,
  description text not null default '',
  question_ids text[] not null,
  seuil numeric not null default 0.8 check (seuil > 0 and seuil <= 1),
  publie boolean not null default false
);

-- Défi du jour : tiré une fois par jour, identique pour tous.
create table public.daily_challenges (
  jour date primary key,
  categorie public.category_id not null,
  question_ids text[] not null
);

-- Garde-fou de fiabilité : un contenu modifié repasse « à vérifier » et est dépublié ;
-- publier un contenu exige qu'il ait été vérifié.
create function public.guard_content() returns trigger
language plpgsql as $$
declare meta text[] := array['verif_statut', 'verif_date', 'verif_par', 'publie'];
begin
  if (to_jsonb(new) - meta) is distinct from (to_jsonb(old) - meta) then
    new.verif_statut := 'a-verifier';
    new.verif_date := null;
    new.verif_par := null;
    new.publie := false;
  end if;
  if new.publie and not old.publie and new.verif_statut <> 'valide' then
    raise exception 'Un contenu doit être vérifié avant publication' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger cards_guard before update on public.cards for each row execute function public.guard_content();
create trigger questions_guard before update on public.questions for each row execute function public.guard_content();
create trigger scenarios_guard before update on public.scenarios for each row execute function public.guard_content();

-- ───────────── Progression (écriture réservée aux fonctions serveur) ─────────────

create table public.user_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp int not null default 0 check (xp >= 0),
  quotidiens date[] not null default '{}'
);

create table public.user_cards (
  user_id uuid references public.profiles (id) on delete cascade,
  card_id text references public.cards (id) on delete cascade,
  obtenue_le timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table public.answers (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  correct boolean not null,
  contexte text not null check (contexte in ('parcours', 'quotidien', 'revision', 'entrainement')),
  at timestamptz not null default now()
);
create index answers_user_question on public.answers (user_id, question_id, at desc);

create table public.parcours_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parcours_id text not null references public.parcours (id) on delete cascade,
  score numeric not null,
  at timestamptz not null default now()
);

create table public.scenario_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  scenario_id text not null references public.scenarios (id) on delete cascade,
  score numeric not null,
  at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid references public.profiles (id) on delete cascade,
  achievement_id text not null,
  at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  label text not null,
  xp int not null default 0,
  at timestamptz not null default now()
);
create index activity_user_at on public.activity (user_id, at desc);

-- ───────────── Sécurité au niveau des lignes ─────────────

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.questions enable row level security;
alter table public.scenarios enable row level security;
alter table public.parcours enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_cards enable row level security;
alter table public.answers enable row level security;
alter table public.parcours_attempts enable row level security;
alter table public.scenario_attempts enable row level security;
alter table public.user_achievements enable row level security;
alter table public.activity enable row level security;

-- Profils : chacun voit le sien, l'administrateur gère tout.
create policy profiles_self on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_admin on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Contenus : lecture des contenus publiés, gestion réservée aux administrateurs.
create policy cards_read on public.cards for select using (publie or public.is_admin());
create policy cards_admin on public.cards for all using (public.is_admin()) with check (public.is_admin());
create policy questions_read on public.questions for select using (publie or public.is_admin());
create policy questions_admin on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy scenarios_read on public.scenarios for select using (publie or public.is_admin());
create policy scenarios_admin on public.scenarios for all using (public.is_admin()) with check (public.is_admin());
create policy parcours_read on public.parcours for select using (publie or public.is_admin());
create policy parcours_admin on public.parcours for all using (public.is_admin()) with check (public.is_admin());
create policy daily_read on public.daily_challenges for select using (auth.uid() is not null);

-- Progression : lecture de la sienne (ou toutes pour l'administrateur). Aucune politique
-- d'écriture : seules les fonctions « security definer » ci-dessous peuvent écrire.
create policy progress_read on public.user_progress for select using (user_id = auth.uid() or public.is_admin());
create policy user_cards_read on public.user_cards for select using (user_id = auth.uid() or public.is_admin());
create policy answers_read on public.answers for select using (user_id = auth.uid() or public.is_admin());
create policy pa_read on public.parcours_attempts for select using (user_id = auth.uid() or public.is_admin());
create policy sa_read on public.scenario_attempts for select using (user_id = auth.uid() or public.is_admin());
create policy ach_read on public.user_achievements for select using (user_id = auth.uid() or public.is_admin());
create policy activity_read on public.activity for select using (user_id = auth.uid() or public.is_admin());

-- La bonne réponse et l'explication ne sont pas lisibles directement par les collaborateurs :
-- elles sont révélées par check_answer() une fois la réponse donnée.
revoke select on public.questions from authenticated, anon;
grant select (id, categorie, difficulte, enonce, choix, nature, sources, verif_statut, verif_date, verif_par, publie)
  on public.questions to authenticated;

-- Lecture complète des questions (avec réponses) pour l'espace administrateur.
create function public.admin_questions() returns setof public.questions
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  return query select * from questions order by categorie, id;
end $$;

-- Création automatique du profil à l'inscription (métadonnées fournies lors de l'invitation).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, prenom, nom, email, equipe, service)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'equipe', ''),
    coalesce(new.raw_user_meta_data ->> 'service', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ═════════════════════════ Règles du jeu (miroir de engine.ts) ═════════════════════════

create function public.niveau(p_xp int) returns int
language sql immutable as $$
  select coalesce(max(n), 1) from generate_series(1, 100) n where 50 * (n - 1) * n <= p_xp;
$$;

create function public.require_active_user() returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from profiles where id = uid and actif) then
    raise exception 'Utilisateur non authentifié ou inactif' using errcode = '42501';
  end if;
  insert into user_progress (user_id) values (uid) on conflict do nothing;
  return uid;
end $$;

create function public.add_activity(p_user uuid, p_type text, p_label text, p_xp int) returns void
language sql security definer set search_path = public as $$
  insert into activity (user_id, type, label, xp) values (p_user, p_type, p_label, p_xp);
  update user_progress set xp = xp + p_xp where user_id = p_user and p_xp > 0;
$$;

-- Défi du jour : créé à la première demande de la journée.
create function public.get_daily_challenge() returns public.daily_challenges
language plpgsql security definer set search_path = public as $$
declare
  d daily_challenges;
  cats category_id[] := array['incendie', 'epi', 'risques', 'postures', 'organisation']::category_id[];
  cat category_id;
begin
  select * into d from daily_challenges where jour = current_date;
  if found then return d; end if;
  cat := cats[1 + ((current_date - date '2000-01-01') % 5)];
  insert into daily_challenges (jour, categorie, question_ids)
  values (current_date, cat, array(select id from questions where categorie = cat and publie order by random() limit 4))
  on conflict (jour) do nothing;
  select * into d from daily_challenges where jour = current_date;
  return d;
end $$;

-- Retour immédiat après une réponse (n'attribue rien).
create function public.check_answer(p_question_id text, p_choix_id text)
returns table (correct boolean, bonne_reponse text, explication text)
language sql stable security definer set search_path = public as $$
  select q.bonne_reponse = p_choix_id, q.bonne_reponse, q.explication
  from questions q where q.id = p_question_id and q.publie and auth.uid() is not null;
$$;

-- Questions dont la dernière réponse est fausse.
create function public.revision_queue(p_user uuid) returns setof text
language sql stable security definer set search_path = public as $$
  select question_id from (
    select distinct on (question_id) question_id, correct from answers
    where user_id = p_user order by question_id, at desc, id desc
  ) last where not correct;
$$;

-- Débloque cartes, bonus de collection et succès. Boucle jusqu'à stabilité.
create function public.grant_rewards(p_user uuid, out nouvelles_cartes text[], out nouveaux_succes text[])
language plpgsql security definer set search_path = public as $$
declare
  c record;
  ok boolean;
  changed boolean := true;
  xp_total int;
  ach record;
begin
  nouvelles_cartes := '{}';
  nouveaux_succes := '{}';
  while changed loop
    changed := false;
    for c in select * from cards where publie and id not in (select card_id from user_cards where user_id = p_user) order by numero loop
      select xp into xp_total from user_progress where user_id = p_user;
      ok := case c.obtention ->> 'type'
        when 'maitrise' then (
          select count(distinct a.question_id) from answers a join questions q on q.id = a.question_id
          where a.user_id = p_user and a.correct and q.categorie = c.categorie
        ) >= (c.obtention ->> 'seuil')::int
        when 'parcours' then exists (
          select 1 from parcours_attempts pa join parcours p on p.id = pa.parcours_id
          where pa.user_id = p_user and pa.parcours_id = c.obtention ->> 'parcoursId' and pa.score >= p.seuil
        )
        when 'scenario' then exists (
          select 1 from scenario_attempts where user_id = p_user and scenario_id = c.obtention ->> 'scenarioId' and score = 1
        )
        when 'collection' then not exists (
          select 1 from cards o where o.publie and o.categorie = c.categorie and o.id <> c.id
            and o.id not in (select card_id from user_cards where user_id = p_user)
        )
        when 'niveau' then public.niveau(xp_total) >= (c.obtention ->> 'niveau')::int
        else false
      end;
      if ok then
        insert into user_cards (user_id, card_id) values (p_user, c.id);
        perform add_activity(p_user, 'carte', 'Carte obtenue : ' || c.nom, 0);
        nouvelles_cartes := nouvelles_cartes || c.id;
        changed := true;
        if not exists (
          select 1 from cards o where o.publie and o.categorie = c.categorie
            and o.id not in (select card_id from user_cards where user_id = p_user)
        ) then
          perform add_activity(p_user, 'carte', 'Famille de cartes complétée', 100);
        end if;
      end if;
    end loop;
  end loop;

  for ach in
    select x.id, x.titre from (values
      ('premier-pas', 'Premier pas', exists (select 1 from answers where user_id = p_user)),
      ('sans-faute', 'Sans faute', exists (select 1 from parcours_attempts where user_id = p_user and score = 1)),
      ('immersion', 'Immersion', exists (select 1 from scenario_attempts where user_id = p_user and score = 1)),
      ('reviseur', 'Réviseur', exists (select 1 from answers where user_id = p_user and contexte = 'revision' and correct)),
      ('assidu', 'Assidu', (select coalesce(cardinality(quotidiens), 0) from user_progress where user_id = p_user) >= 3),
      ('collectionneur', 'Collectionneur', (select count(*) from user_cards where user_id = p_user) >= 10),
      ('album-complet', 'Album complet', exists (
        select 1 from cards c1 where c1.publie group by c1.categorie
        having bool_and(c1.id in (select card_id from user_cards where user_id = p_user)))),
      ('maitre', 'Maître collectionneur', not exists (
        select 1 from cards where publie and id not in (select card_id from user_cards where user_id = p_user)))
    ) as x (id, titre, ok)
    where x.ok
    union all
    select 'expert-' || cat::text, 'Expert ' || cat::text from unnest(enum_range(null::category_id)) cat
    where not exists (
      select 1 from parcours p where p.publie and p.categorie = cat and not exists (
        select 1 from parcours_attempts pa where pa.user_id = p_user and pa.parcours_id = p.id and pa.score >= p.seuil))
      and not exists (
      select 1 from scenarios s where s.publie and s.categorie = cat and not exists (
        select 1 from scenario_attempts sa where sa.user_id = p_user and sa.scenario_id = s.id and sa.score = 1))
  loop
    insert into user_achievements (user_id, achievement_id) values (p_user, ach.id) on conflict do nothing;
    if found then
      perform add_activity(p_user, 'succes', 'Succès débloqué : ' || ach.titre, 0);
      nouveaux_succes := nouveaux_succes || ach.id;
    end if;
  end loop;
end $$;

-- Soumission d'un quiz : seul point d'entrée qui attribue de l'XP pour des réponses.
create function public.submit_quiz(p_contexte text, p_parcours_id text, p_reponses jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_active_user();
  ids text[];
  expected text[];
  r record;
  is_correct boolean;
  gained int := 0;
  answer_xp int;
  nb int := 0;
  nb_ok int := 0;
  v_score numeric;
  valide boolean := false;
  label text := 'Quiz';
  def parcours;
  daily daily_challenges;
  niveau_avant int;
  corrections jsonb := '[]';
  rewards record;
begin
  select array_agg(x ->> 'questionId') into ids from jsonb_array_elements(p_reponses) x;
  if ids is null or cardinality(ids) <> (select count(distinct v) from unnest(ids) v) then
    raise exception 'Soumission invalide : questions absentes ou répétées' using errcode = '22023';
  end if;

  -- On ne peut pas choisir ses questions : elles doivent correspondre exactement au défi.
  if p_contexte = 'parcours' then
    select * into def from parcours where id = p_parcours_id and publie;
    if not found then raise exception 'Parcours inconnu' using errcode = '22023'; end if;
    select array_agg(q) into expected from unnest(def.question_ids) q where q in (select id from questions where publie);
  elsif p_contexte = 'quotidien' then
    daily := get_daily_challenge();
    expected := daily.question_ids;
  elsif p_contexte = 'revision' then
    if exists (select 1 from unnest(ids) i where i not in (select revision_queue(uid))) then
      raise exception 'Question absente de la file de révision' using errcode = '22023';
    end if;
  elsif p_contexte <> 'entrainement' then
    raise exception 'Contexte inconnu' using errcode = '22023';
  end if;
  if expected is not null and (select array_agg(v order by v) from unnest(ids) v) is distinct from (select array_agg(v order by v) from unnest(expected) v) then
    raise exception 'Soumission invalide : questions inattendues' using errcode = '22023';
  end if;

  select niveau(xp) into niveau_avant from user_progress where user_id = uid;

  for r in
    select q.id, q.bonne_reponse, x ->> 'choixId' as choix
    from jsonb_array_elements(p_reponses) x join questions q on q.id = x ->> 'questionId' and q.publie
  loop
    is_correct := r.bonne_reponse = r.choix;
    -- XP uniquement à la première réussite d'une question.
    answer_xp := case when is_correct and not exists (
      select 1 from answers where user_id = uid and question_id = r.id and correct) then 10 else 0 end;
    insert into answers (user_id, question_id, correct, contexte) values (uid, r.id, is_correct, p_contexte);
    gained := gained + answer_xp;
    nb := nb + 1;
    nb_ok := nb_ok + is_correct::int;
    corrections := corrections || jsonb_build_object('questionId', r.id, 'correct', is_correct, 'xp', answer_xp);
  end loop;
  v_score := case when nb = 0 then 0 else nb_ok::numeric / nb end;

  if p_contexte = 'parcours' then
    label := 'Parcours : ' || def.titre;
    valide := v_score >= def.seuil;
    if valide and not exists (
      select 1 from parcours_attempts pa where pa.user_id = uid and pa.parcours_id = def.id and pa.score >= def.seuil) then
      gained := gained + 50;
    end if;
    insert into parcours_attempts (user_id, parcours_id, score) values (uid, def.id, v_score);
  elsif p_contexte = 'quotidien' then
    label := 'Défi du jour';
    valide := v_score >= 0.75;
    if valide and not (select current_date = any (up.quotidiens) from user_progress up where up.user_id = uid) then
      gained := gained + 30;
      update user_progress set quotidiens = quotidiens || current_date where user_id = uid;
    end if;
  elsif p_contexte = 'revision' then
    label := 'Révision';
    valide := v_score = 1;
  end if;

  perform add_activity(uid,
    case p_contexte when 'parcours' then 'parcours' when 'quotidien' then 'quotidien' when 'revision' then 'revision' else 'quiz' end,
    format('%s (%s %%)', label, round(v_score * 100)), gained);
  rewards := grant_rewards(uid);

  return jsonb_build_object(
    'score', v_score,
    'valide', valide,
    'corrections', corrections,
    'xpGagne', gained + (select coalesce(sum(xp), 0) from activity where user_id = uid and type = 'carte' and at = now()),
    'nouvellesCartes', to_jsonb(rewards.nouvelles_cartes),
    'nouveauxSucces', to_jsonb(rewards.nouveaux_succes),
    'niveauAvant', niveau_avant,
    'niveauApres', (select niveau(xp) from user_progress where user_id = uid)
  );
end $$;

create function public.submit_scenario(p_scenario_id text, p_choix jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_active_user();
  s scenarios;
  nb int;
  nb_ok int;
  v_score numeric;
  gained int := 0;
  niveau_avant int;
  rewards record;
begin
  select * into s from scenarios where id = p_scenario_id and publie;
  if not found then raise exception 'Mise en situation inconnue' using errcode = '22023'; end if;
  select niveau(xp) into niveau_avant from user_progress where user_id = uid;

  select count(*), count(*) filter (where exists (
    select 1 from jsonb_array_elements(e -> 'options') o
    where o ->> 'id' = p_choix ->> (e ->> 'id') and (o ->> 'correct')::boolean))
  into nb, nb_ok from jsonb_array_elements(s.etapes) e;
  v_score := nb_ok::numeric / greatest(nb, 1);

  if v_score = 1 and not exists (select 1 from scenario_attempts sa where sa.user_id = uid and sa.scenario_id = s.id and sa.score = 1) then
    gained := 40;
  end if;
  insert into scenario_attempts (user_id, scenario_id, score) values (uid, s.id, v_score);
  perform add_activity(uid, 'scenario', format('Mise en situation : %s (%s/%s)', s.titre, nb_ok, nb), gained);
  rewards := grant_rewards(uid);

  return jsonb_build_object(
    'score', v_score,
    'valide', v_score = 1,
    'xpGagne', gained + (select coalesce(sum(xp), 0) from activity where user_id = uid and type = 'carte' and at = now()),
    'nouvellesCartes', to_jsonb(rewards.nouvelles_cartes),
    'nouveauxSucces', to_jsonb(rewards.nouveaux_succes),
    'niveauAvant', niveau_avant,
    'niveauApres', (select niveau(xp) from user_progress where user_id = uid)
  );
end $$;

-- Classement : expose uniquement les informations nécessaires des collaborateurs actifs.
create function public.leaderboard(p_periode text default 'general')
returns table (user_id uuid, prenom text, nom text, service text, equipe text, xp bigint, niveau int, cartes bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.prenom, p.nom, p.service, p.equipe,
    case when p_periode = 'semaine'
      then (select coalesce(sum(a.xp), 0) from activity a where a.user_id = p.id and a.at >= date_trunc('week', now()))
      else coalesce(up.xp, 0)::bigint end,
    niveau(coalesce(up.xp, 0)),
    (select count(*) from user_cards uc where uc.user_id = p.id)
  from profiles p left join user_progress up on up.user_id = p.id
  where p.actif and p.role = 'collaborateur' and auth.uid() is not null
  order by 6 desc, p.nom;
$$;

-- Validation et publication : publier exige un contenu vérifié.
create function public.set_verification(p_kind text, p_id text, p_valide boolean)
returns void language plpgsql security definer set search_path = public as $$
declare who text;
begin
  if not is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  select prenom || ' ' || nom into who from profiles where id = auth.uid();
  execute format(
    'update %I set verif_statut = $1, verif_date = $2, verif_par = $3 %s where id = $4',
    case p_kind when 'card' then 'cards' when 'question' then 'questions' when 'scenario' then 'scenarios' end,
    case when p_valide then '' else ', publie = false' end)
  using (case when p_valide then 'valide' else 'a-verifier' end)::verif_statut,
        case when p_valide then current_date end,
        case when p_valide then who end,
        p_id;
end $$;

-- Les fonctions internes ne sont pas appelables par les clients.
revoke execute on function public.add_activity(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.grant_rewards(uuid) from public, anon, authenticated;
revoke execute on function public.revision_queue(uuid) from public, anon, authenticated;
revoke execute on function public.require_active_user() from public, anon, authenticated;
