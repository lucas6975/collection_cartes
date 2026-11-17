-- Team Ulysse : l'administrateur inscrit lui-même au tirage au sort une personne déjà inscrite
-- dans l'appli (qui a oublié de choisir ses jours). Code administrateur exigé.
-- À copier une seule fois dans Supabase › SQL Editor › Run.

create or replace function public.admin_inscrire_tirage(p_code text, p_id uuid, p_jours int[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  update participants set jours = jours_valides(p_jours), modifie_le = now() where id = p_id;
  if not found then
    raise exception 'Personne introuvable';
  end if;
end $$;
revoke execute on function public.admin_inscrire_tirage(text, uuid, int[]) from public;
grant execute on function public.admin_inscrire_tirage(text, uuid, int[]) to anon, authenticated;
