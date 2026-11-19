-- Team Ulysse : numérotation des cartes collector « Ulysse en Or » (Roue de Secours).
-- À copier une seule fois dans Supabase › SQL Editor › Run.
-- Anonyme : un numéro par téléphone, dans l'ordre des gagnants (n° 1, 2, 3…).

create table if not exists public.ulysse_or (
  numero serial primary key,
  appareil uuid not null unique,
  le timestamptz not null default now()
);
alter table public.ulysse_or enable row level security;
revoke all on public.ulysse_or from anon, authenticated;

create or replace function public.numero_ulysse_or(p_appareil uuid) returns int
language plpgsql security definer set search_path = public as $$
begin
  insert into ulysse_or (appareil) values (p_appareil) on conflict (appareil) do nothing;
  return (select numero from ulysse_or where appareil = p_appareil);
end $$;
revoke execute on function public.numero_ulysse_or(uuid) from public;
grant execute on function public.numero_ulysse_or(uuid) to anon, authenticated;
