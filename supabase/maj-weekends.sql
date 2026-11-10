-- ════════════════════════════════════════════════════════════════════════════
-- Mise à jour : plus de tirage les week-ends de décembre (5, 6, 12, 13, 19 et 20).
-- À exécuter une fois dans Supabase : SQL Editor › New query › coller › Run.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Les inscriptions ne gardent que les jours ouvrés.
create or replace function public.jours_valides(p int[]) returns int[]
language sql immutable as $$
  select coalesce(array_agg(distinct j order by j), '{}')
  from unnest(coalesce(p, '{}')) j
  where j between 1 and 24 and j not in (5, 6, 12, 13, 19, 20)
$$;

-- 2. On retire les week-ends des personnes déjà inscrites.
update public.participants set jours = public.jours_valides(jours), modifie_le = now()
where jours && array[5, 6, 12, 13, 19, 20];

-- 3. Aucun tirage possible un week-end.
alter table public.tirages add constraint tirages_pas_le_weekend check (jour not in (5, 6, 12, 13, 19, 20));
