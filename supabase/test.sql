-- Tests de supabase/setup.sql sur un PostgreSQL local (code admin de test : sapin2026).
set role anon;
\echo '--- 1. lecture directe des inscrits (doit échouer)'
select * from participants;
\echo '--- 2. inscriptions'
select inscrire('  Camille ', 'Martin', array[1,2,3,3,40]) ->> 'jours' as camille;
select inscrire('Karim', 'Benali', array[1,2]) ->> 'prenom' as karim;
select inscrire('Julie', 'Lefèvre', array[2]) ->> 'prenom' as julie;
\echo '--- 3. même nom depuis un autre téléphone : jours fusionnés'
select inscrire('camille', 'MARTIN', array[5]) ->> 'jours' as camille_fusion;
\echo '--- 4. nom vide (doit échouer)'
select inscrire(' ', 'X', array[1]);
\echo '--- 5. mauvais code admin (doit échouer)'
select admin_liste('mauvais');
\echo '--- 6. liste avec le bon code'
select jsonb_array_length(admin_liste('sapin2026') -> 'participants') as nb_inscrits;
\echo '--- 7. tirages : jour 1, puis jour 2 (le gagnant du 1 est exclu)'
select admin_tirer('sapin2026', 1) ->> 'prenom' as gagnant_j1;
select admin_tirer('sapin2026', 2) ->> 'prenom' as gagnant_j2;
\echo '--- 8. retirer le même jour sans « refaire » (doit échouer)'
select admin_tirer('sapin2026', 1);
\echo '--- 9. jour sans inscrit disponible (doit échouer)'
select admin_tirer('sapin2026', 20);
\echo '--- 10. tirage sans code (doit échouer)'
select admin_tirer('', 3);
\echo '--- 11. le gagnant voit son résultat'
select ma_participation((select inscrire('Camille', 'Martin', array[1,2,3,5]) ->> 'jeton')::uuid) -> 'gagne' as gagne_camille;
\echo '--- 12. le site ne peut pas appeler les fonctions internes'
select verifier_code('sapin2026');
