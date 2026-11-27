-- Team Ulysse : visites sécurité, chaque écart a un libellé (obligatoire), une description et
-- une photo facultatives. À copier dans Supabase › SQL Editor › Run (peut être relancé).

alter table public.visite_secu_ecarts add column if not exists libelle text;
update public.visite_secu_ecarts set libelle = left(description, 120) where libelle is null;
alter table public.visite_secu_ecarts alter column libelle set not null;
alter table public.visite_secu_ecarts drop constraint if exists visite_secu_ecarts_libelle_check;
alter table public.visite_secu_ecarts add constraint visite_secu_ecarts_libelle_check
  check (char_length(trim(libelle)) between 1 and 120);
alter table public.visite_secu_ecarts drop constraint if exists visite_secu_ecarts_description_check;
alter table public.visite_secu_ecarts alter column description drop not null;
alter table public.visite_secu_ecarts add constraint visite_secu_ecarts_description_check
  check (description is null or char_length(description) <= 1000);

create or replace function public.visite_secu_ecarts_liste(
  p_visite uuid, p_jeton uuid default null, p_code text default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'numero', numero, 'zone', zone,
      'libelle', libelle, 'description', description, 'photo', photo is not null,
      'statut', statut, 'cree_par', cree_par, 'cree_le', cree_le) order by numero)
    from visite_secu_ecarts where visite_id = p_visite), '[]');
end $$;

drop function if exists public.visite_ecart_ajouter(uuid, text, text, text, text, uuid, text);
create or replace function public.visite_ecart_ajouter(
  p_visite uuid, p_zone text, p_libelle text, p_description text, p_photo text, p_par text,
  p_jeton uuid default null, p_code text default null
) returns int
language plpgsql security definer set search_path = public as $$
declare v_numero int;
begin
  perform remontees_acces(p_jeton, p_code);
  perform pg_advisory_xact_lock(hashtext(p_visite::text));
  select coalesce(max(numero), 0) + 1 into v_numero from visite_secu_ecarts where visite_id = p_visite;
  insert into visite_secu_ecarts (visite_id, numero, zone, libelle, description, photo, cree_par)
  values (p_visite, v_numero, nullif(trim(p_zone), ''), trim(p_libelle),
          nullif(trim(coalesce(p_description, '')), ''), nullif(p_photo, ''), nullif(trim(p_par), ''));
  return v_numero;
end $$;
revoke execute on function public.visite_ecart_ajouter(uuid, text, text, text, text, text, uuid, text) from public;
grant execute on function public.visite_ecart_ajouter(uuid, text, text, text, text, text, uuid, text) to anon, authenticated;
