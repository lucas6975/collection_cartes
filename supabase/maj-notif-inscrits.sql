-- Team Ulysse : notification « Nouvel inscrit » sur le téléphone de l'administrateur.
-- À copier une seule fois dans Supabase › SQL Editor › Run.
-- Puis remettre à jour la fonction « envoyer-rappels » (tout-en-un.ts).

-- Téléphones de l'administrateur à prévenir (déjà inscrits aux rappels).
create table if not exists public.admin_alertes (
  endpoint text primary key references public.rappels_abonnes (endpoint) on delete cascade,
  cree_le timestamptz not null default now()
);
alter table public.admin_alertes enable row level security;
revoke all on public.admin_alertes from anon, authenticated;

-- Nouveaux inscrits en attente d'annonce.
create table if not exists public.notifs_inscrits (
  participant_id uuid primary key references public.participants (id) on delete cascade,
  envoye_le timestamptz
);
alter table public.notifs_inscrits enable row level security;
revoke all on public.notifs_inscrits from anon, authenticated;

-- Active (vrai), coupe (faux) ou lit (null) l'alerte pour ce téléphone. Code administrateur exigé.
create or replace function public.admin_alertes_inscrits(
  p_code text, p_endpoint text, p_actif boolean default null
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform verifier_code(p_code);
  if p_actif is true then
    if not exists (select 1 from rappels_abonnes where endpoint = p_endpoint) then
      raise exception 'Active d’abord les rappels sur ce téléphone (onglet Moi › Mes rappels)';
    end if;
    insert into admin_alertes (endpoint) values (p_endpoint) on conflict do nothing;
  elsif p_actif is false then
    delete from admin_alertes where endpoint = p_endpoint;
  end if;
  return exists (select 1 from admin_alertes where endpoint = p_endpoint);
end $$;
revoke execute on function public.admin_alertes_inscrits(text, text, boolean) from public;
grant execute on function public.admin_alertes_inscrits(text, text, boolean) to anon, authenticated;

-- À chaque nouvelle inscription : mise en attente, puis la fonction envoie l'alerte.
-- Ne bloque jamais une inscription, même si l'envoi échoue.
create or replace function public.inscrit_a_notifier() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  begin
    insert into notifs_inscrits (participant_id) values (new.id) on conflict do nothing;
    perform net.http_post(
      url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"inscrits": true}'::jsonb
    );
  exception when others then
    null;
  end;
  return new;
end $$;

drop trigger if exists inscrit_notif on public.participants;
create trigger inscrit_notif after insert on public.participants
for each row execute function public.inscrit_a_notifier();
