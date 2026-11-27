-- Team Ulysse : liste d'appel du poste de garde (scannée ou saisie) enregistrée avec l'évacuation,
-- pour que Lucas et Vincent voient la même comparaison avec les présents de l'appli.
-- À lancer après maj-evacuation-alerte.sql (peut être relancé).

alter table public.evacuations add column if not exists liste_appel jsonb;

create or replace function public.evacuation_liste_appel(
  p_id uuid, p_noms jsonb, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  update evacuations
  set liste_appel = p_noms,
      effectif_liste = case when p_noms is null then effectif_liste else jsonb_array_length(p_noms) end
  where id = p_id;
end $$;
revoke execute on function public.evacuation_liste_appel(uuid, jsonb, uuid, text) from public;
grant execute on function public.evacuation_liste_appel(uuid, jsonb, uuid, text) to anon, authenticated;

create or replace function public.evacuation_suivi(
  p_id uuid default null, p_jeton uuid default null, p_code text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := coalesce(p_id, evacuation_active());
begin
  perform remontees_acces(p_jeton, p_code);
  return jsonb_build_object(
    'active', evacuation_active(),
    'abonnes', (select count(*) from rappels_abonnes),
    'evacuation', (select jsonb_build_object('id', id, 'debut', debut, 'fin', fin,
        'lance_par', lance_par, 'effectif_liste', effectif_liste, 'test', test,
        'liste_appel', liste_appel)
      from evacuations where id = v_id),
    'presents', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'prenom', prenom, 'nom', nom, 'statut', statut, 'societe', societe,
        'appli', participant_id is not null, 'ajoute_par', ajoute_par, 'pointe', pointe,
        'heure', cree_le) order by upper(nom), upper(prenom))
      from evacuation_presents where evacuation_id = v_id), '[]'),
    'historique', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'debut', e.debut,
        'fin', e.fin, 'test', e.test,
        'total', (select count(*) from evacuation_presents p where p.evacuation_id = e.id))
        order by e.debut desc) from (select * from evacuations order by debut desc limit 30) e), '[]')
  );
end $$;
revoke execute on function public.evacuation_suivi(uuid, uuid, text) from public;
grant execute on function public.evacuation_suivi(uuid, uuid, text) to anon, authenticated;
