-- Team Ulysse : onglet « Roue » de l'espace admin (qui a vu, ouvert et fait tourner la Roue de Secours).
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).

create table if not exists public.roue_suivi (
  participant_id uuid primary key references public.participants (id) on delete cascade,
  vue_le timestamptz,      -- a vu la bannière de la roue sur l'accueil
  ouverte_le timestamptz,  -- a ouvert l'écran de la roue
  tournee_le timestamptz,  -- a fait tourner la roue
  gain text
);
alter table public.roue_suivi enable row level security;
revoke all on public.roue_suivi from anon, authenticated;

-- Le téléphone signale une étape (la première date est gardée).
create or replace function public.noter_roue(p_jeton uuid, p_etape text, p_gain text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := (select id from participants where jeton = p_jeton);
begin
  if pid is null or p_etape not in ('vue', 'ouverte', 'tournee') then return; end if;
  insert into roue_suivi (participant_id) values (pid) on conflict do nothing;
  update roue_suivi set
    vue_le = coalesce(vue_le, now()),
    ouverte_le = case when p_etape in ('ouverte', 'tournee') then coalesce(ouverte_le, now()) else ouverte_le end,
    tournee_le = case when p_etape = 'tournee' then coalesce(tournee_le, now()) else tournee_le end,
    gain = case when p_etape = 'tournee' then coalesce(gain, left(p_gain, 20)) else gain end
  where participant_id = pid;
end $$;
revoke execute on function public.noter_roue(uuid, text, text) from public;
grant execute on function public.noter_roue(uuid, text, text) to anon, authenticated;

-- Les chiffres pour l'administrateur.
create or replace function public.admin_roue(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'participant_id', participant_id, 'vue_le', vue_le, 'ouverte_le', ouverte_le,
      'tournee_le', tournee_le, 'gain', gain))
    from roue_suivi), '[]');
end $$;
revoke execute on function public.admin_roue(text) from public;
grant execute on function public.admin_roue(text) to anon, authenticated;
