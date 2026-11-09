-- Scénarios de règles et de sécurité. Lancer avec scripts/test-db.sh.
\set ON_ERROR_STOP 0
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000c', 'camille@ex.fr', '{"prenom":"Camille","nom":"Martin","service":"Production"}'),
 ('00000000-0000-0000-0000-00000000000b', 'karim@ex.fr', '{"prenom":"Karim","nom":"Benali","service":"Production"}');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';

\echo '--- 1. ajouter une carte à sa collection directement (doit échouer)'
insert into user_cards (user_id, card_id) values ('00000000-0000-0000-0000-00000000000c', 'serre-file');
\echo '--- 2. enregistrer soi-même une ouverture de pack (doit échouer)'
insert into pack_openings (user_id, jour, card_ids) values ('00000000-0000-0000-0000-00000000000c', current_date, '{casque}');
\echo '--- 3. ouvrir le pack du jour : 5 cartes, la dernière au moins peu commune'
select jsonb_array_length(r -> 'cards') as nb_cartes,
       (select rarete from cards where id = r -> 'cards' ->> 4) <> 'commune' as derniere_peu_commune_ou_mieux,
       r -> 'nouvelles' as nouvelles
from (select open_daily_pack() as r) x;
\echo '--- 4. rouvrir le même jour (doit échouer)'
select open_daily_pack();
\echo '--- 5. collection : 5 exemplaires au total'
select sum(exemplaires) as exemplaires, count(*) as cartes_differentes from user_cards;
\echo '--- 6. participants actifs (Camille, série 1, ouvert aujourd hui)'
select prenom, cartes, serie, ouvert_aujourdhui from active_participants();
\echo '--- 7. Camille ne voit pas la collection de Karim'
reset role;
insert into pack_openings (user_id, jour, card_ids) values ('00000000-0000-0000-0000-00000000000b', jour_local() - 1, '{casque}');
insert into user_cards (user_id, card_id) values ('00000000-0000-0000-0000-00000000000b', 'casque');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select count(*) as lignes_de_karim_visibles from user_cards where user_id = '00000000-0000-0000-0000-00000000000b';
\echo '--- 8. distribution des raretés sur 20 000 tirages (≈ 55/27/12/5/1)'
reset role;
select r, round(100.0 * count(*) / 20000, 1) as pct from (select tirer_rarete(false) r from generate_series(1, 20000)) t group by r order by r;
