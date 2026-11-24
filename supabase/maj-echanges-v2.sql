-- Team Ulysse : échanges v2. Chaque côté partage aussi ses cartes MANQUANTES, pour que les deux
-- voient tout de suite ce qui les arrange.
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).
-- Les anciennes versions de l'appli continuent de fonctionner (nouveaux paramètres facultatifs).

alter table public.echanges add column if not exists manquantes_a text[] not null default '{}';
alter table public.echanges add column if not exists manquantes_b text[] not null default '{}';

create or replace function public.echange_json(e public.echanges) returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'code', e.code, 'etat', e.etat, 'nom_a', e.nom_a, 'nom_b', e.nom_b,
    'doublons_a', e.doublons_a, 'doublons_b', e.doublons_b,
    'manquantes_a', e.manquantes_a, 'manquantes_b', e.manquantes_b,
    'donne_b', e.donne_b, 'recoit_b', e.recoit_b
  );
$$;
revoke all on function public.echange_json(public.echanges) from public, anon, authenticated;

drop function if exists public.echange_creer(text, text[]);
create or replace function public.echange_creer(
  p_nom text, p_doublons text[], p_manquantes text[] default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_cle uuid;
  v_lettres text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if char_length(trim(coalesce(p_nom, ''))) = 0 then
    raise exception 'Nom obligatoire' using errcode = '22023';
  end if;
  if coalesce(array_length(p_doublons, 1), 0) > 60 or coalesce(array_length(p_manquantes, 1), 0) > 60 then
    raise exception 'Trop de cartes' using errcode = '22023';
  end if;
  delete from echanges where cree_le < now() - interval '1 day';
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_lettres, 1 + floor(random() * length(v_lettres))::int, 1);
    end loop;
    exit when not exists (select 1 from echanges where code = v_code);
  end loop;
  insert into echanges (code, nom_a, doublons_a, manquantes_a)
  values (v_code, left(trim(p_nom), 130), coalesce(p_doublons, '{}'), coalesce(p_manquantes, '{}'))
  returning cle_a into v_cle;
  return jsonb_build_object('code', v_code, 'cle', v_cle);
end $$;

drop function if exists public.echange_rejoindre(text, text, text[]);
create or replace function public.echange_rejoindre(
  p_code text, p_nom text, p_doublons text[], p_manquantes text[] default '{}'
) returns jsonb
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
  if coalesce(array_length(p_doublons, 1), 0) > 60 or coalesce(array_length(p_manquantes, 1), 0) > 60 then
    raise exception 'Trop de cartes' using errcode = '22023';
  end if;
  update echanges
     set cle_b = gen_random_uuid(), nom_b = left(trim(p_nom), 130),
         doublons_b = coalesce(p_doublons, '{}'), manquantes_b = coalesce(p_manquantes, '{}'),
         maj_le = now()
   where code = e.code
  returning * into e;
  return echange_json(e) || jsonb_build_object('cle', e.cle_b);
end $$;

grant execute on function public.echange_creer(text, text[], text[]) to anon, authenticated;
grant execute on function public.echange_rejoindre(text, text, text[], text[]) to anon, authenticated;
