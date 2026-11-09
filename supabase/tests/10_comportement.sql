-- Scénarios de sécurité et de règles du jeu. Lancer avec scripts/test-db.sh.
\set ON_ERROR_STOP 0
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a', 'admin@ex.fr', '{"prenom":"Nathalie","nom":"Durand","service":"Direction"}'),
 ('00000000-0000-0000-0000-00000000000c', 'camille@ex.fr', '{"prenom":"Camille","nom":"Martin","service":"Production","equipe":"A"}');
update profiles set role = 'admin' where email = 'admin@ex.fr';

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
\echo '--- 1. lire la bonne réponse directement (doit échouer)'
select bonne_reponse from questions limit 1;
\echo '--- 2. se donner de l XP directement (doit échouer ou ne rien modifier)'
insert into user_progress (user_id, xp) values ('00000000-0000-0000-0000-00000000000c', 9999);
insert into user_cards (user_id, card_id) values ('00000000-0000-0000-0000-00000000000c', 'serre-file');
update user_progress set xp = 9999;
\echo '--- 3. parcours incendie parfait'
select submit_quiz('parcours', 'p-incendie', (select jsonb_agg(jsonb_build_object('questionId', id, 'choixId', c)) from (values ('inc-1','a'),('inc-2','b'),('inc-3','d'),('inc-4','b'),('inc-5','b'),('inc-6','b')) v(id,c))) - 'corrections' as parcours;
\echo '--- 4. même parcours rejoué : 0 XP attendu'
select submit_quiz('parcours', 'p-incendie', (select jsonb_agg(jsonb_build_object('questionId', id, 'choixId', c)) from (values ('inc-1','a'),('inc-2','b'),('inc-3','d'),('inc-4','b'),('inc-5','b'),('inc-6','b')) v(id,c))) -> 'xpGagne' as xp_rejoue;
\echo '--- 5. triche : parcours avec une seule question (doit échouer)'
select submit_quiz('parcours', 'p-incendie', '[{"questionId":"inc-1","choixId":"a"}]');
\echo '--- 6. triche : question répétée (doit échouer)'
select submit_quiz('entrainement', null, '[{"questionId":"inc-1","choixId":"a"},{"questionId":"inc-1","choixId":"a"}]');
\echo '--- 7. défi du jour'
select submit_quiz('quotidien', null, (select jsonb_agg(jsonb_build_object('questionId', q.id, 'choixId', 'x')) from unnest((get_daily_challenge()).question_ids) i join questions q on q.id = i)) - 'corrections' as quotidien_faux;
\echo '--- 8. scénario EPI réussi'
select submit_scenario('s-epi', '{"e1":"b","e2":"b","e3":"a"}') - 'corrections' as scenario;
\echo '--- 9. état final du collaborateur'
select xp, niveau(xp), (select string_agg(card_id, ',' order by card_id) from user_cards) cartes, (select string_agg(achievement_id, ',') from user_achievements) succes from user_progress;
select count(*) as a_reviser from (select distinct on (question_id) correct from answers order by question_id, at desc, id desc) x where not correct;
\echo '--- 10. classement visible'
select prenom, xp, niveau, cartes from leaderboard('general');
\echo '--- 11. un collaborateur ne peut pas modifier une carte (0 ligne)'
update cards set nom = 'Piraté' where id = 'casque';
select nom from cards where id = 'casque';

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
\echo '--- 12. admin modifie une carte -> repasse à vérifier et dépubliée'
update cards set description = description || ' (révisé)' where id = 'casque';
select verif_statut, publie from cards where id = 'casque';
\echo '--- 13. publier sans vérifier (doit échouer)'
update cards set publie = true where id = 'casque';
\echo '--- 14. vérifier puis publier'
select set_verification('card', 'casque', true);
update cards set publie = true where id = 'casque';
select verif_statut, verif_date = current_date as aujourdhui, verif_par, publie from cards where id = 'casque';
\echo '--- 15. admin lit les réponses via admin_questions()'
select count(*) from admin_questions();
