-- Team Ulysse : remontées v2. Page « Remontées reçues » pour les destinataires (Lucas, Vincent)
-- et pour l'administrateur, avec « marquer comme traitée ».
-- À copier dans Supabase › SQL Editor › Run, après maj-remontees.sql (peut être relancé).

-- Destinataires : recherche tolérante (majuscules, espaces, accents : Masméjan = MASMEJAN).
delete from public.remontees_destinataires;
insert into public.remontees_destinataires (participant_id)
select id from public.participants
where (translate(upper(trim(nom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ', 'EEEEAAAIIOOUUUC') like '%ATTARD%'
       and translate(upper(trim(prenom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ', 'EEEEAAAIIOOUUUC') like 'LUCAS%')
   or (translate(upper(trim(nom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ', 'EEEEAAAIIOOUUUC') like '%MASMEJAN%'
       and translate(upper(trim(prenom)), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ', 'EEEEAAAIIOOUUUC') like 'VINCENT%')
on conflict do nothing;

-- Accès : un destinataire (par son jeton d'inscription) ou l'administrateur (par son code).
create or replace function public.remontees_acces(p_jeton uuid, p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_jeton is not null and exists (
    select 1 from remontees_destinataires d join participants p on p.id = d.participant_id
    where p.jeton = p_jeton
  ) then
    return;
  end if;
  if p_code is null then
    raise exception 'Réservé aux personnes qui reçoivent les remontées' using errcode = '28000';
  end if;
  perform verifier_code(p_code);
end $$;
revoke execute on function public.remontees_acces(uuid, text) from public, anon, authenticated;

create or replace function public.mes_remontees(p_jeton uuid default null, p_code text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'prenom', prenom, 'nom', nom, 'type', type, 'lieu', lieu,
      'description', description, 'gravite', gravite, 'cree_le', cree_le, 'traitee', traitee
    ) order by traitee, cree_le desc)
    from (select * from remontees order by cree_le desc limit 200) r), '[]');
end $$;
revoke execute on function public.mes_remontees(uuid, text) from public;
grant execute on function public.mes_remontees(uuid, text) to anon, authenticated;

create or replace function public.traiter_remontee(
  p_id uuid, p_traitee boolean, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  update remontees set traitee = p_traitee where id = p_id;
end $$;
revoke execute on function public.traiter_remontee(uuid, boolean, uuid, text) from public;
grant execute on function public.traiter_remontee(uuid, boolean, uuid, text) to anon, authenticated;

-- Vérification : doit afficher Lucas ATTARD et Vincent MASMEJAN, et si leur téléphone est abonné.
select p.prenom, p.nom,
       exists (select 1 from rappels_abonnes r where r.participant_id = p.id) as telephone_abonne
from remontees_destinataires d join participants p on p.id = d.participant_id;
