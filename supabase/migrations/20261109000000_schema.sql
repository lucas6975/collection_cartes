-- ════════════════════════════════════════════════════════════════════════════
-- Vigie : schéma de base de données (Supabase / PostgreSQL)
--
-- Principe anti-triche : les collections ne sont JAMAIS modifiables directement par
-- un client. Le navigateur appelle open_daily_pack(), qui tire les cartes côté serveur
-- (mêmes probabilités que src/domain/packs.ts) et garantit un seul pack par jour.
-- ════════════════════════════════════════════════════════════════════════════

create type public.category_id as enum ('incendie', 'epi', 'risques', 'postures', 'organisation');
create type public.rarity as enum ('commune', 'peu-commune', 'rare', 'epique', 'legendaire');
create type public.nature as enum ('obligation', 'norme', 'recommandation', 'pratique-interne');
create type public.verif_statut as enum ('a-verifier', 'valide');

-- Fuseau de référence pour le changement de jour du pack.
create function public.jour_local() returns date
language sql stable as $$ select (now() at time zone 'Europe/Paris')::date $$;

-- ───────────── Comptes ─────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null,
  nom text not null,
  equipe text not null default '',
  service text not null default '',
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (métadonnées fournies lors de l'invitation).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, prenom, nom, equipe, service)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    coalesce(new.raw_user_meta_data ->> 'equipe', ''),
    coalesce(new.raw_user_meta_data ->> 'service', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Cartes ─────────────

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
  nature public.nature not null,
  sources jsonb not null default '[]',
  verif_statut public.verif_statut not null default 'a-verifier',
  verif_date date,
  verif_par text
);

-- ───────────── Collections (écriture réservée aux fonctions serveur) ─────────────

create table public.pack_openings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  jour date not null,
  ouvert_le timestamptz not null default now(),
  card_ids text[] not null,
  -- Un seul pack du jour par collaborateur : garanti par la base, même en cas d'appels simultanés.
  unique (user_id, jour)
);

create table public.user_cards (
  user_id uuid references public.profiles (id) on delete cascade,
  card_id text references public.cards (id) on delete cascade,
  exemplaires int not null default 1 check (exemplaires > 0),
  obtenue_le timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ───────────── Sécurité au niveau des lignes ─────────────

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.pack_openings enable row level security;
alter table public.user_cards enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid());
create policy cards_read on public.cards for select using (auth.uid() is not null);
-- Lecture de ses propres données uniquement. Aucune politique d'écriture : seules les
-- fonctions « security definer » ci-dessous modifient les collections.
create policy openings_read on public.pack_openings for select using (user_id = auth.uid());
create policy user_cards_read on public.user_cards for select using (user_id = auth.uid());

-- ═════════════════════════ Ouverture du pack (miroir de packs.ts) ═════════════════════════

-- Tire une rareté selon la table de probabilités (en pourcentages cumulés).
create function public.tirer_rarete(p_garantie boolean) returns public.rarity
language plpgsql volatile as $$
declare
  x numeric := random() * 100;
  -- Emplacement normal : 55 / 27 / 12 / 5 / 1. Dernier emplacement : peu commune minimum.
  seuils numeric[] := case when p_garantie then array[0, 62, 88, 97, 100] else array[55, 82, 94, 99, 100] end;
  raretes public.rarity[] := array['commune', 'peu-commune', 'rare', 'epique', 'legendaire']::public.rarity[];
begin
  for i in 1..5 loop
    if x < seuils[i] then return raretes[i]; end if;
  end loop;
  return 'legendaire';
end $$;

create function public.open_daily_pack() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tirage text[] := '{}';
  nouvelles boolean[] := '{}';
  r rarity;
  carte text;
begin
  if uid is null or not exists (select 1 from profiles where id = uid and actif) then
    raise exception 'Utilisateur non authentifié ou inactif' using errcode = '42501';
  end if;
  if exists (select 1 from pack_openings where user_id = uid and jour = jour_local()) then
    raise exception 'Le pack du jour a déjà été ouvert.' using errcode = 'P0001';
  end if;

  for i in 1..5 loop
    r := tirer_rarete(i = 5);
    -- Évite les doublons dans un même pack quand c'est possible.
    carte := (select id from cards where rarete = r and not (id = any (tirage)) order by random() limit 1);
    if carte is null then
      carte := (select id from cards where rarete = r order by random() limit 1);
    end if;
    tirage := tirage || carte;
  end loop;

  -- Tri de la plus commune à la plus rare : la meilleure carte se révèle en dernier.
  tirage := (select array_agg(t.id order by c.rarete, t.ord)
             from unnest(tirage) with ordinality t(id, ord) join cards c on c.id = t.id);

  insert into pack_openings (user_id, jour, card_ids) values (uid, jour_local(), tirage);

  foreach carte in array tirage loop
    nouvelles := nouvelles || not exists (select 1 from user_cards where user_id = uid and card_id = carte);
    insert into user_cards (user_id, card_id) values (uid, carte)
      on conflict (user_id, card_id) do update set exemplaires = user_cards.exemplaires + 1;
  end loop;

  return jsonb_build_object('cards', to_jsonb(tirage), 'nouvelles', to_jsonb(nouvelles));
end $$;

-- Participants actifs : pack ouvert ces 7 derniers jours, avec leur nombre de cartes
-- et leur série de jours consécutifs. N'expose que le nécessaire.
create function public.active_participants()
returns table (user_id uuid, prenom text, nom text, service text, cartes bigint, serie int, ouvert_aujourdhui boolean)
language sql stable security definer set search_path = public as $$
  with jours as (
    select o.user_id, o.jour, o.jour - (row_number() over (partition by o.user_id order by o.jour))::int as ilot
    from pack_openings o
  ),
  series as (
    select j.user_id, count(*)::int as longueur, max(j.jour) as fin from jours j group by j.user_id, j.ilot
  )
  select p.id, p.prenom, p.nom, p.service,
    (select count(*) from user_cards uc where uc.user_id = p.id),
    coalesce((select s.longueur from series s where s.user_id = p.id and s.fin >= jour_local() - 1
              order by s.fin desc limit 1), 0),
    exists (select 1 from pack_openings o where o.user_id = p.id and o.jour = jour_local())
  from profiles p
  where p.actif and auth.uid() is not null
    and exists (select 1 from pack_openings o where o.user_id = p.id and o.jour >= jour_local() - 7)
  order by 5 desc, 6 desc, p.nom;
$$;

revoke execute on function public.tirer_rarete(boolean) from public, anon, authenticated;
