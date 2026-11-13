-- ════════════════════════════════════════════════════════════════════════════
-- Team Ulysse : notification à la personne tirée au sort
--
-- À exécuter dans Supabase : SQL Editor › nouvel onglet VIDE › coller tout › Run.
-- Puis remettre à jour la fonction « envoyer-rappels » (docs/NOTIFICATIONS.md).
-- Le script peut être relancé sans risque.
--
-- À chaque tirage (espace administrateur), la personne tirée au sort est mise en attente ici,
-- puis la fonction « envoyer-rappels » lui envoie une notification sur ses téléphones :
--   « 🎁 Tu as été tiré(e) au sort ! C'est toi le gagnant du N décembre… »
-- En décembre, le message part le jour même du tirage, jamais en avance.
-- Seules les personnes qui ont activé les rappels peuvent être prévenues.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_net with schema extensions;

create table if not exists public.notifs_gagnants (
  jour int primary key check (jour between 1 and 24),
  participant_id uuid not null references public.participants (id) on delete cascade,
  envoye_le timestamptz
);
alter table public.notifs_gagnants enable row level security;
revoke all on public.notifs_gagnants from anon, authenticated;

-- Appelée après chaque tirage (ou annulation) : met la personne en attente et réveille la fonction.
create or replace function public.tirage_a_notifier() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then
    delete from notifs_gagnants where jour = old.jour and envoye_le is null;
    return old;
  end if;
  if new.participant_id is null then
    return new;
  end if;
  insert into notifs_gagnants (jour, participant_id) values (new.jour, new.participant_id)
  on conflict (jour) do update set participant_id = excluded.participant_id, envoye_le = null;
  perform net.http_post(
    url := 'https://madwvbzvjgckzykuqvdm.supabase.co/functions/v1/envoyer-rappels',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"gagnants": true}'::jsonb
  );
  return new;
end $$;

drop trigger if exists tirage_notif on public.tirages;
create trigger tirage_notif after insert or delete on public.tirages
for each row execute function public.tirage_a_notifier();
