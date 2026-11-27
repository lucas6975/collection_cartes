-- Team Ulysse : se déclarer présent exige d'avoir scanné le QR du point de rassemblement.
-- Le QR (affiche et écran de Lucas / Vincent) contient un code secret permanent : sans lui, la
-- déclaration est refusée (personne en télétravail qui toucherait l'alerte depuis chez elle).
-- Lucas, Vincent et l'administrateur en sont dispensés.
-- À lancer après maj-evacuation-liste.sql (peut être relancé : le code n'est créé qu'une fois).

create table if not exists public.evacuation_config (
  id int primary key default 1 check (id = 1),
  code_lieu text not null
);
alter table public.evacuation_config enable row level security;
revoke all on public.evacuation_config from anon, authenticated;
insert into public.evacuation_config (id, code_lieu)
values (1, encode(extensions.gen_random_bytes(6), 'hex'))
on conflict (id) do nothing;

drop function if exists public.rassemblement_present(text, text, text, text, text, uuid);
create or replace function public.rassemblement_present(
  p_prenom text, p_nom text, p_statut text default 'Salarié IMECA', p_societe text default null,
  p_appareil text default null, p_jeton uuid default null,
  p_lieu text default null, p_code text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_evac uuid := evacuation_active();
  v_participant uuid;
  v_id uuid;
  v_heure timestamptz;
  v_dispense boolean := false;
begin
  if v_evac is null then
    raise exception 'Aucune évacuation en cours' using errcode = 'P0002';
  end if;
  -- Lucas, Vincent (destinataires) et l'administrateur : pas besoin du QR.
  if p_jeton is not null then
    v_dispense := exists (select 1 from remontees_destinataires d join participants p
                          on p.id = d.participant_id where p.jeton = p_jeton);
  end if;
  if not v_dispense and p_code is not null then
    begin
      perform verifier_code(p_code);
      v_dispense := true;
    exception when others then
      v_dispense := false;
    end;
  end if;
  if not v_dispense and coalesce(p_lieu, '') <> (select code_lieu from evacuation_config where id = 1) then
    raise exception 'Scanne le QR code du point de rassemblement pour te déclarer présent(e).'
      using errcode = '28000';
  end if;
  if p_jeton is not null then
    select id into v_participant from participants where jeton = p_jeton;
  end if;
  select id, cree_le into v_id, v_heure from evacuation_presents
  where evacuation_id = v_evac
    and lower(trim(prenom)) = lower(trim(p_prenom)) and lower(trim(nom)) = lower(trim(p_nom));
  if v_id is not null then
    update evacuation_presents set prenom = trim(p_prenom), nom = trim(p_nom),
      statut = left(coalesce(p_statut, statut), 40), societe = nullif(trim(p_societe), ''),
      participant_id = coalesce(v_participant, participant_id)
    where id = v_id;
    return jsonb_build_object('deja', true, 'heure', v_heure);
  end if;
  insert into evacuation_presents (evacuation_id, prenom, nom, statut, societe, participant_id, appareil)
  values (v_evac, trim(p_prenom), trim(p_nom), left(coalesce(p_statut, 'Salarié IMECA'), 40),
          nullif(trim(p_societe), ''), v_participant, p_appareil)
  returning cree_le into v_heure;
  return jsonb_build_object('deja', false, 'heure', v_heure);
end $$;
revoke execute on function public.rassemblement_present(text, text, text, text, text, uuid, text, text) from public;
grant execute on function public.rassemblement_present(text, text, text, text, text, uuid, text, text) to anon, authenticated;

-- Le code du point de rassemblement, pour afficher le QR sur le téléphone de Lucas et Vincent.
create or replace function public.evacuation_code_lieu(p_jeton uuid default null, p_code text default null)
returns text
language plpgsql stable security definer set search_path = public as $$
begin
  perform remontees_acces(p_jeton, p_code);
  return (select code_lieu from evacuation_config where id = 1);
end $$;
revoke execute on function public.evacuation_code_lieu(uuid, text) from public;
grant execute on function public.evacuation_code_lieu(uuid, text) to anon, authenticated;
