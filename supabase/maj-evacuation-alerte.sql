-- Team Ulysse : alerte évacuation. Au lancement, une notification part :
--   • « Vraie évacuation incendie » : sur tous les téléphones abonnés aux rappels ;
--   • « Évacuation test » : seulement sur ceux de Lucas, Vincent et de l'administrateur.
-- Pendant un test, l'alerte plein écran de l'appli ne s'affiche que pour eux.
-- À lancer après maj-evacuation.sql (peut être relancé). Puis remettre à jour envoyer-rappels.

alter table public.evacuations add column if not exists test boolean not null default false;
alter table public.evacuations add column if not exists notif_envoyee_le timestamptz;
update public.evacuations set notif_envoyee_le = coalesce(notif_envoyee_le, now());

create or replace function public.rassemblement_etat() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('active', e.id is not null, 'id', e.id, 'debut', e.debut,
                            'test', coalesce(e.test, false))
  from (select evacuation_active() as id) a left join evacuations e on e.id = a.id;
$$;
revoke execute on function public.rassemblement_etat() from public;
grant execute on function public.rassemblement_etat() to anon, authenticated;

drop function if exists public.evacuation_demarrer(text, uuid, text);
create or replace function public.evacuation_demarrer(
  p_par text default null, p_test boolean default false,
  p_jeton uuid default null, p_code text default null
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := evacuation_active();
begin
  perform remontees_acces(p_jeton, p_code);
  if v_id is not null then return v_id; end if;
  insert into evacuations (lance_par, test) values (nullif(trim(p_par), ''), coalesce(p_test, false))
  returning id into v_id;
  -- Notification immédiate (fonction envoyer-rappels).
  begin
    perform net.http_post(
      url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"evacuation": true}'::jsonb
    );
  exception when others then
    null;
  end;
  return v_id;
end $$;
revoke execute on function public.evacuation_demarrer(text, boolean, uuid, text) from public;
grant execute on function public.evacuation_demarrer(text, boolean, uuid, text) to anon, authenticated;

-- Suivi : on ajoute « test » à l'évacuation et à l'historique.
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
        'lance_par', lance_par, 'effectif_liste', effectif_liste, 'test', test)
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
