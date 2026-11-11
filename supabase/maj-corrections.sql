-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : corrections des cases du calendrier
--
-- Tout le monde voit la correction d'une case juste après l'avoir terminée, SAUF la personne
-- tirée au sort ce jour-là : pour elle, la correction reste cachée tant que l'administrateur
-- ne l'a pas débloquée depuis son espace (onglet Résultats).
--
-- À exécuter dans Supabase : SQL Editor › nouvel onglet VIDE › coller tout › Run.
-- Le script peut être relancé sans risque.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.tirages add column if not exists correction_debloquee boolean not null default false;

-- Le téléphone demande s'il doit cacher la correction de ce jour (vrai seulement pour le gagnant
-- du jour, tant que l'administrateur ne l'a pas débloquée).
create or replace function public.correction_bloquee(p_jeton uuid, p_jour int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tirages t join participants p on p.id = t.participant_id
    where p.jeton = p_jeton and t.jour = p_jour and not t.correction_debloquee
  )
$$;

-- Administrateur : débloquer (ou rebloquer) la correction pour le gagnant d'un jour.
create or replace function public.admin_debloquer_correction(
  p_code text, p_jour int, p_debloquer boolean default true
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  update tirages set correction_debloquee = p_debloquer where jour = p_jour;
end $$;

-- La liste de l'administrateur indique aussi si la correction est débloquée.
create or replace function public.admin_liste(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return jsonb_build_object(
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'prenom', prenom, 'nom', nom, 'jours', to_jsonb(jours), 'inscrit_le', inscrit_le)
        order by lower(nom), lower(prenom))
      from participants), '[]'),
    'tirages', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'participant_id', participant_id, 'prenom', prenom, 'nom', nom, 'tire_le', tire_le, 'correction_debloquee', correction_debloquee)
        order by jour)
      from tirages), '[]')
  );
end $$;

revoke execute on function public.correction_bloquee(uuid, int),
  public.admin_debloquer_correction(text, int, boolean) from public;
grant execute on function public.correction_bloquee(uuid, int) to anon, authenticated;
grant execute on function public.admin_debloquer_correction(text, int, boolean) to anon, authenticated;
grant execute on function public.admin_liste(text) to anon, authenticated;
