-- Team Ulysse : l'Espace Sécurité (SST, remontées, accident, urgences) et la page « Remontées
-- reçues » ouverts aux destinataires des remontées (Vincent), sans le code administrateur.
-- Les autres inscrits ne voient rien. À lancer après maj-remontees-v2.sql (peut être relancé).

-- Accès à l'Espace Sécurité : vrai pour un destinataire des remontées.
create or replace function public.acces_securite(p_jeton uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from remontees_destinataires d join participants p on p.id = d.participant_id
    where p.jeton = p_jeton
  );
$$;
revoke execute on function public.acces_securite(uuid) from public;
grant execute on function public.acces_securite(uuid) to anon, authenticated;

-- Liste des SST : administrateur (code) ou destinataire (jeton).
drop function if exists public.securite_sst(text);
create or replace function public.securite_sst(p_code text default null, p_jeton uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'prenom', prenom, 'nom', nom, 'telephone', telephone, 'role', role, 'lieu', lieu
    ) order by case lieu when 'RDC' then 1 when 'Étage' then 2 when 'Atelier' then 3 else 4 end,
               ordre, nom)
    from sst_contacts), '[]');
end $$;
revoke execute on function public.securite_sst(text, uuid) from public;
grant execute on function public.securite_sst(text, uuid) to anon, authenticated;
