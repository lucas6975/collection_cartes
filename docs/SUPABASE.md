# Connecter la base de données (Supabase)

La base sert à **centraliser les inscriptions** (prénom, nom, jours choisis) et les **tirages au
sort**. Compte gratuit, environ 5 minutes.

## 1. Créer le projet

1. Va sur <https://supabase.com> et crée un compte (bouton « Start your project »).
2. Clique sur **New project** :
   - **Name** : `team-ulysse`
   - **Database Password** : un mot de passe solide (garde-le, il ne servira presque jamais)
   - **Region** : _West EU (Paris)_
3. Attends une à deux minutes que le projet soit prêt.

## 2. Créer les tables

1. Dans le menu de gauche : **SQL Editor** › **New query**.
2. Ouvre le fichier [`supabase/setup.sql`](../supabase/setup.sql), copie **tout** son contenu et colle-le.
3. **Tout en bas**, remplace `CHOISIS-TON-CODE` par ton code administrateur (au moins 8 caractères,
   ne le partage pas : c'est lui qui protège la liste des noms et le tirage).
4. Clique sur **Run**. Le message « Success. No rows returned » confirme que tout est en place.

## 3. Récupérer les deux informations de connexion

Dans **Project Settings** (roue dentée) › **API** :

- **Project URL** : ressemble à `https://abcdefgh.supabase.co`
- **anon public** (dans « Project API keys ») : une longue clé qui commence par `eyJ…`

Ces deux informations sont **publiques par conception** : elles ne permettent que d'appeler les
fonctions prévues, et la liste des inscrits reste protégée par ton code. Tu peux donc me les envoyer
directement ; ne m'envoie en revanche **ni ton code administrateur, ni le mot de passe de la base,
ni la clé « service_role »**.

Je les ajoute dans `src/config.ts`, et le site est connecté.

## 4. Sur ton téléphone

Ouvre le site, touche **« Je suis l'administrateur »** et saisis ton code : ton téléphone devient
l'administrateur (bouton **Admin** en haut). Tu y trouves la liste des inscrits, le tirage au sort de
chaque jour et l'export Excel.

## Changer le code administrateur

Dans **SQL Editor**, exécute (en remplaçant le code) :

```sql
update public.admin_config set code_hash = extensions.crypt('NOUVEAU-CODE', extensions.gen_salt('bf'));
```

## Après le calendrier

Les noms sont des données personnelles : une fois l'opération terminée, supprime les inscriptions
(**Table Editor** › `participants` › tout sélectionner › supprimer), ou le projet entier.

## Mise à jour : volontaires de la coalition

Le menu de l’appli propose « Rejoins la coalition Team Ulysse ». Pour enregistrer les réponses,
exécuter **une fois** `supabase/maj-coalition-et-rappels.sql` (SQL Editor › nouvel onglet vide › coller ›
Run). Sur le téléphone de l’administrateur, l’encadré « Coalition Team Ulysse » du menu ouvre ensuite
la liste des volontaires, avec un export Excel.

## Mise à jour : corrections des cases

À la fin de chaque case, un bouton **« Voir la correction »** affiche l’image de correction
(`public/avent/corrections/jour-N.webp`, aussi dans `communication/corrections/` pour la
partager). La personne tirée au sort ce jour-là ne la voit pas tant que l’administrateur ne l’a pas
débloquée (espace administrateur › onglet **Résultats** › « Débloquer sa correction »).
Exécuter **une fois** `supabase/maj-corrections.sql` (SQL Editor › nouvel onglet vide › Run).
Tant que ce n’est pas fait, la correction s’affiche pour tout le monde.
