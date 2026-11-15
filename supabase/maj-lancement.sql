-- Team Ulysse : chiffres du lancement pour l'espace administrateur.
-- À copier une seule fois dans Supabase › SQL Editor › Run. Ne modifie aucune donnée.

create or replace function public.admin_lancement(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return jsonb_build_object(
    -- Téléphones qui reçoivent au moins un rappel.
    'rappels', (select count(*) from rappels_abonnes),
    -- Inscrits dont au moins un téléphone reçoit les rappels.
    'avec_rappels', coalesce((
      select jsonb_agg(distinct participant_id) from rappels_abonnes
      where participant_id is not null), '[]'),
    -- Échanges de cartes acceptés des deux côtés.
    'echanges', (select count(*) from echanges where etat = 'accepte')
  );
end $$;

revoke execute on function public.admin_lancement(text) from public;
grant execute on function public.admin_lancement(text) to anon, authenticated;
