-- Team Ulysse : EPS v2. Notification à chaque EPS enregistrée (Lucas, Vincent, téléphones admin)
-- et suppression des EPS par les destinataires (Lucas, Vincent) ou l'administrateur.
-- À lancer après maj-eps.sql (peut être relancé). Puis remettre à jour la fonction envoyer-rappels.

alter table public.eps add column if not exists envoye_le timestamptz;
-- Les EPS déjà enregistrées ne déclenchent pas de notification.
update public.eps set envoye_le = now() where envoye_le is null;

create or replace function public.eps_enregistrer(
  p_eps jsonb, p_jeton uuid default null, p_code text default null
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_date date := (p_eps->>'date')::date;
  v_cle text := upper(trim(p_eps->>'cle'));
  v_avant date;
  v_id uuid;
begin
  perform remontees_acces(p_jeton, p_code);
  if v_cle = '' or v_date is null then
    raise exception 'EPS incomplète' using errcode = '22023';
  end if;
  select max(date_eps) into v_avant from eps
  where (cle = v_cle
         or (position('.' in cle) = 0 and cle = split_part(v_cle, '.', 2))
         or (position('.' in v_cle) = 0 and split_part(cle, '.', 2) = v_cle))
    and date_eps > v_date - interval '2 months' and date_eps <= v_date + interval '2 months';
  if v_avant is not null then
    raise exception 'Déjà interviewé(e) le % : attendre 2 mois', to_char(v_avant, 'DD/MM/YYYY')
      using errcode = '23505';
  end if;
  insert into eps (interviewe, cle, interviewer, manager, correspondant, service, secteur,
                   date_eps, reponses, niveaux, score, niveau)
  values (trim(p_eps->>'interviewe'), v_cle, trim(p_eps->>'interviewer'),
          nullif(trim(p_eps->>'manager'), ''), nullif(trim(p_eps->>'correspondant'), ''),
          nullif(trim(p_eps->>'service'), ''), nullif(trim(p_eps->>'secteur'), ''),
          v_date, p_eps->'reponses',
          array(select jsonb_array_elements_text(p_eps->'niveaux')::int),
          (p_eps->>'score')::numeric, (p_eps->>'niveau')::int)
  returning id into v_id;
  delete from eps_volontaires where upper(nom) = upper(trim(p_eps->>'interviewe'));
  -- Notification « nouvelle EPS » aux destinataires (fonction envoyer-rappels).
  begin
    perform net.http_post(
      url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"eps": true}'::jsonb
    );
  exception when others then
    null;
  end;
  return v_id;
end $$;
revoke execute on function public.eps_enregistrer(jsonb, uuid, text) from public;
grant execute on function public.eps_enregistrer(jsonb, uuid, text) to anon, authenticated;

-- Supprimer une EPS (test, erreur) : destinataires des remontées ou administrateur.
drop function if exists public.eps_supprimer(uuid, text);
create or replace function public.eps_supprimer(
  p_id uuid, p_jeton uuid default null, p_code text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  delete from eps where id = p_id;
end $$;
revoke execute on function public.eps_supprimer(uuid, uuid, text) from public;
grant execute on function public.eps_supprimer(uuid, uuid, text) to anon, authenticated;
