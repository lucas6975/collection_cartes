-- Team Ulysse : TEST de l'espace Sécurité (onglets SST, Remontée, Accident), administrateur seulement.
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).
-- Les numéros des SST ne sont JAMAIS écrits dans le code de l'appli (public) : ils sont ici, dans
-- la base, et seul le code administrateur peut les lire pendant le test.

create table if not exists public.sst_contacts (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  telephone text not null,
  role text not null default 'Sauveteur secouriste du travail',
  ordre int not null default 0
);
alter table public.sst_contacts enable row level security;
revoke all on public.sst_contacts from anon, authenticated;

create or replace function public.securite_sst(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'prenom', prenom, 'nom', nom, 'telephone', telephone, 'role', role
    ) order by ordre, nom)
    from sst_contacts), '[]');
end $$;
revoke execute on function public.securite_sst(text) from public;
grant execute on function public.securite_sst(text) to anon, authenticated;

-- Ajouter un SST (à faire dans Supabase, pas dans ce fichier) :
-- insert into public.sst_contacts (prenom, nom, telephone) values ('Prénom', 'NOM', '06 00 00 00 00');
