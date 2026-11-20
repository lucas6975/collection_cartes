-- Team Ulysse : l'administrateur offre une carte à une personne (QR code à usage unique).
-- À copier une seule fois dans Supabase › SQL Editor › Run.

create table if not exists public.cadeaux (
  code text primary key,
  carte text not null check (char_length(carte) < 80),
  cree_le timestamptz not null default now(),
  utilise_le timestamptz,
  appareil uuid
);
alter table public.cadeaux enable row level security;
revoke all on public.cadeaux from anon, authenticated;

-- L'administrateur crée un cadeau : renvoie le code à mettre dans le QR.
create or replace function public.admin_creer_cadeau(p_code text, p_carte text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  c text;
begin
  perform verifier_code(p_code);
  c := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
  insert into cadeaux (code, carte) values (c, p_carte);
  return c;
end $$;

-- Le collègue scanne le QR : une seule fois, dans les 24 heures. Renvoie l'identifiant de la carte.
create or replace function public.recevoir_cadeau(p_code text, p_appareil uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  r cadeaux;
begin
  select * into r from cadeaux where code = upper(p_code) for update;
  if not found then raise exception 'Ce cadeau n’existe pas.'; end if;
  if r.utilise_le is not null then raise exception 'Ce cadeau a déjà été récupéré.'; end if;
  if r.cree_le < now() - interval '24 hours' then raise exception 'Ce cadeau a expiré.'; end if;
  update cadeaux set utilise_le = now(), appareil = p_appareil where code = r.code;
  return r.carte;
end $$;

revoke execute on function public.admin_creer_cadeau(text, text), public.recevoir_cadeau(text, uuid) from public;
grant execute on function public.admin_creer_cadeau(text, text), public.recevoir_cadeau(text, uuid) to anon, authenticated;
