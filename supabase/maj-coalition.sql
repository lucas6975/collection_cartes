-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : volontaires pour rejoindre la coalition sécurité
--
-- À exécuter UNE fois dans Supabase : SQL Editor › nouvel onglet VIDE › coller › Run.
-- ════════════════════════════════════════════════════════════════════════════

create table public.volontaires (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 60),
  nom text not null check (char_length(nom) between 1 and 60),
  -- Lien avec l'inscription au calendrier, quand la personne en a une.
  participant_id uuid references public.participants (id) on delete set null,
  le timestamptz not null default now()
);
-- Une seule fois par personne (prénom + nom, sans tenir compte des majuscules).
create unique index volontaires_nom_unique on public.volontaires (lower(prenom), lower(nom));

alter table public.volontaires enable row level security;
revoke all on public.volontaires from anon, authenticated;

-- Un collaborateur dit « oui, je veux rejoindre la coalition ».
create function public.rejoindre_coalition(p_prenom text, p_nom text, p_jeton uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_prenom text := nettoyer(p_prenom);
  v_nom text := nettoyer(p_nom);
  v_id uuid;
begin
  if char_length(v_prenom) = 0 or char_length(v_nom) = 0 then
    raise exception 'Prénom et nom obligatoires' using errcode = '22023';
  end if;
  insert into volontaires (prenom, nom, participant_id)
  values (v_prenom, v_nom, (select id from participants where jeton = p_jeton))
  on conflict ((lower(prenom)), (lower(nom))) do nothing
  returning id into v_id;
  return jsonb_build_object('deja', v_id is null);
end $$;

-- Administrateur : la liste des volontaires.
create function public.admin_volontaires(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'prenom', prenom, 'nom', nom, 'participant_id', participant_id, 'le', le)
      order by le desc)
    from volontaires), '[]');
end $$;

-- Administrateur : retirer quelqu'un de la liste (doublon, erreur…).
create function public.admin_supprimer_volontaire(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  delete from volontaires where id = p_id;
end $$;

revoke execute on function public.rejoindre_coalition(text, text, uuid),
  public.admin_volontaires(text), public.admin_supprimer_volontaire(text, uuid)
  from public;
grant execute on function public.rejoindre_coalition(text, text, uuid) to anon, authenticated;
grant execute on function public.admin_volontaires(text) to anon, authenticated;
grant execute on function public.admin_supprimer_volontaire(text, uuid) to anon, authenticated;
