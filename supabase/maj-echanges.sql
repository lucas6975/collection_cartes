-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : échange de cartes en face à face (QR code)
--
-- À exécuter dans Supabase : SQL Editor › nouvel onglet VIDE › coller tout › Run.
-- Le script peut être relancé sans risque.
--
-- Déroulé d'un échange :
--   1. A affiche son QR code : echange_creer (avec la liste de ses doublons).
--   2. B scanne le code : echange_rejoindre (reçoit les doublons de A, envoie les siens).
--   3. B choisit une carte à donner et une à recevoir : echange_proposer.
--   4. A accepte ou refuse : echange_repondre. Chaque téléphone met alors sa collection à jour.
-- Chaque côté reçoit une clé secrète : seul lui peut agir sur l'échange.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.echanges (
  code text primary key,
  cle_a uuid not null default gen_random_uuid(),
  cle_b uuid,
  nom_a text not null check (char_length(nom_a) between 1 and 130),
  nom_b text check (char_length(nom_b) between 1 and 130),
  doublons_a text[] not null default '{}',
  doublons_b text[] not null default '{}',
  -- Carte que B donne, carte que B reçoit (prise dans les doublons de A).
  donne_b text,
  recoit_b text,
  etat text not null default 'ouvert'
    check (etat in ('ouvert', 'propose', 'accepte', 'refuse', 'annule')),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

alter table public.echanges enable row level security;
revoke all on public.echanges from anon, authenticated;

-- Vue d'un échange pour l'un des deux côtés.
create or replace function public.echange_json(e public.echanges) returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'code', e.code, 'etat', e.etat, 'nom_a', e.nom_a, 'nom_b', e.nom_b,
    'doublons_a', e.doublons_a, 'doublons_b', e.doublons_b,
    'donne_b', e.donne_b, 'recoit_b', e.recoit_b
  );
$$;

-- 1. A crée un échange et obtient le code à afficher en QR code.
create or replace function public.echange_creer(p_nom text, p_doublons text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_cle uuid;
  v_lettres text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if char_length(trim(coalesce(p_nom, ''))) = 0 then
    raise exception 'Nom obligatoire' using errcode = '22023';
  end if;
  if coalesce(array_length(p_doublons, 1), 0) > 60 then
    raise exception 'Trop de cartes' using errcode = '22023';
  end if;
  -- Ménage : les échanges de plus d'un jour sont effacés.
  delete from echanges where cree_le < now() - interval '1 day';
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_lettres, 1 + floor(random() * length(v_lettres))::int, 1);
    end loop;
    exit when not exists (select 1 from echanges where code = v_code);
  end loop;
  insert into echanges (code, nom_a, doublons_a)
  values (v_code, left(trim(p_nom), 130), coalesce(p_doublons, '{}'))
  returning cle_a into v_cle;
  return jsonb_build_object('code', v_code, 'cle', v_cle);
end $$;

-- 2. B scanne le code de A.
create or replace function public.echange_rejoindre(p_code text, p_nom text, p_doublons text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e echanges;
begin
  select * into e from echanges where code = upper(trim(p_code)) for update;
  if not found or e.etat = 'annule' or e.cree_le < now() - interval '30 minutes' then
    raise exception 'Ce code n’est plus valable : demande à ton collègue d’en afficher un nouveau.'
      using errcode = '22023';
  end if;
  if e.cle_b is not null then
    raise exception 'Ce code est déjà utilisé par un autre collègue.' using errcode = '22023';
  end if;
  if coalesce(array_length(p_doublons, 1), 0) > 60 then
    raise exception 'Trop de cartes' using errcode = '22023';
  end if;
  update echanges
     set cle_b = gen_random_uuid(), nom_b = left(trim(p_nom), 130),
         doublons_b = coalesce(p_doublons, '{}'), maj_le = now()
   where code = e.code
  returning * into e;
  return echange_json(e) || jsonb_build_object('cle', e.cle_b);
end $$;

-- 3. B propose : une carte qu'il donne (un de ses doublons) contre un doublon de A.
create or replace function public.echange_proposer(p_code text, p_cle uuid, p_donne text, p_recoit text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e echanges;
begin
  select * into e from echanges where code = p_code and cle_b = p_cle for update;
  if not found then raise exception 'Échange introuvable' using errcode = '22023'; end if;
  if e.etat not in ('ouvert', 'refuse') then
    raise exception 'Cet échange est terminé.' using errcode = '22023';
  end if;
  if not (p_recoit = any (e.doublons_a)) or not (p_donne = any (e.doublons_b)) then
    raise exception 'Seuls les doublons peuvent être échangés.' using errcode = '22023';
  end if;
  update echanges set donne_b = p_donne, recoit_b = p_recoit, etat = 'propose', maj_le = now()
   where code = e.code returning * into e;
  return echange_json(e);
end $$;

-- 4. A accepte ou refuse la proposition.
create or replace function public.echange_repondre(p_code text, p_cle uuid, p_accepte boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e echanges;
begin
  select * into e from echanges where code = p_code and cle_a = p_cle for update;
  if not found then raise exception 'Échange introuvable' using errcode = '22023'; end if;
  if e.etat <> 'propose' then
    raise exception 'Il n’y a pas de proposition à valider.' using errcode = '22023';
  end if;
  update echanges set etat = case when p_accepte then 'accepte' else 'refuse' end, maj_le = now()
   where code = e.code returning * into e;
  return echange_json(e);
end $$;

-- État de l'échange, pour l'un ou l'autre côté (le téléphone vérifie toutes les 2 secondes).
create or replace function public.echange_voir(p_code text, p_cle uuid) returns jsonb
language sql security definer set search_path = public as $$
  select echange_json(e) from echanges e where code = p_code and (cle_a = p_cle or cle_b = p_cle);
$$;

-- Annulation par l'un ou l'autre côté (tant que rien n'est accepté).
create or replace function public.echange_annuler(p_code text, p_cle uuid) returns void
language sql security definer set search_path = public as $$
  update echanges set etat = 'annule', maj_le = now()
   where code = p_code and (cle_a = p_cle or cle_b = p_cle) and etat <> 'accepte';
$$;

revoke all on function public.echange_json(public.echanges) from public, anon, authenticated;
grant execute on function public.echange_creer(text, text[]) to anon, authenticated;
grant execute on function public.echange_rejoindre(text, text, text[]) to anon, authenticated;
grant execute on function public.echange_proposer(text, uuid, text, text) to anon, authenticated;
grant execute on function public.echange_repondre(text, uuid, boolean) to anon, authenticated;
grant execute on function public.echange_voir(text, uuid) to anon, authenticated;
grant execute on function public.echange_annuler(text, uuid) to anon, authenticated;
