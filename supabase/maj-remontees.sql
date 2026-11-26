-- Team Ulysse : remontées de situation à risque, avec notification sur les téléphones choisis.
-- À copier une seule fois dans Supabase › SQL Editor › Run (peut être relancé sans risque).
-- Puis remettre à jour la fonction « envoyer-rappels » (tout-en-un.ts).

create table if not exists public.remontees (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(trim(prenom)) between 1 and 60),
  nom text not null check (char_length(trim(nom)) between 1 and 60),
  type text not null check (char_length(type) <= 40),
  lieu text not null check (char_length(trim(lieu)) between 1 and 120),
  description text not null check (char_length(trim(description)) between 1 and 1000),
  gravite text not null check (gravite in ('Faible', 'Moyenne', 'Grave')),
  cree_le timestamptz not null default now(),
  envoye_le timestamptz,
  traitee boolean not null default false
);
alter table public.remontees enable row level security;
revoke all on public.remontees from anon, authenticated;

-- Personnes qui reçoivent la notification (par leur inscription à l'appli).
create table if not exists public.remontees_destinataires (
  participant_id uuid primary key references public.participants (id) on delete cascade
);
alter table public.remontees_destinataires enable row level security;
revoke all on public.remontees_destinataires from anon, authenticated;

-- Envoi d'une remontée depuis l'appli : enregistrée, puis la fonction envoie la notification.
create or replace function public.envoyer_remontee(
  p_prenom text, p_nom text, p_type text, p_lieu text, p_description text, p_gravite text
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into remontees (prenom, nom, type, lieu, description, gravite)
  values (trim(p_prenom), trim(p_nom), left(p_type, 40), trim(p_lieu), trim(p_description), p_gravite);
  begin
    perform net.http_post(
      url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"remontees": true}'::jsonb
    );
  exception when others then
    null;
  end;
end $$;
revoke execute on function public.envoyer_remontee(text, text, text, text, text, text) from public;
grant execute on function public.envoyer_remontee(text, text, text, text, text, text) to anon, authenticated;
