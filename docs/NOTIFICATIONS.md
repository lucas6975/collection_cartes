# Rappels sur les téléphones (notifications)

> **Pour la personne qui configure Supabase :** tout se fait dans le tableau de bord Supabase du
> projet, en suivant la partie « Mise en place » ci-dessous. Le fichier
> `supabase/maj-coalition-et-rappels.sql` installe **en une fois** les rappels **et** la liste des
> volontaires de la coalition Team Ulysse (encadré « Coalition Team Ulysse » du menu, sur le téléphone de l’administrateur).
> Il peut être relancé sans risque.

Deux rappels, que chacun active ou coupe dans l’appli :

| Rappel                     | Quand                                                        | Ouvre           |
| -------------------------- | ------------------------------------------------------------ | --------------- |
| 🃏 Pack du jour disponible | du lundi au vendredi, 8 h 30                                 | les cartes      |
| 🎄 Case du jour à ouvrir   | jours ouvrés du 1er au 24 décembre, 7 h 30 (17 : scène choc) | la case du jour |

Jamais le soir ni le week-end. Les heures sont celles de Paris, été comme hiver.

## Qui peut les recevoir ?

- **Android** : directement, après avoir touché « Activer les rappels ».
- **iPhone** (iOS 16.4 ou plus récent) : seulement si Team Ulysse est **ajoutée à l’écran d’accueil**
  et ouverte **depuis son icône**. Dans Safari, l’appli explique comment faire.
- Un téléphone pro géré par le service informatique peut bloquer les notifications : faire un essai.

> Une icône ajoutée à l’écran d’accueil **avant** cette version doit être supprimée puis ajoutée à
> nouveau (Safari › Partager › Sur l’écran d’accueil) pour pouvoir recevoir les rappels.

## Comment ça marche

1. Le téléphone accepte les notifications : il est enregistré dans la table `rappels_abonnes`
   (fonction `enregistrer_rappels`). Aucune donnée personnelle n’est nécessaire.
2. Une tâche programmée Supabase appelle la fonction `envoyer-rappels` du lundi au vendredi.
3. La fonction calcule l’heure de Paris, choisit le rappel du moment et l’envoie à tous les abonnés,
   **une seule fois par jour** (table `rappels_envois`). Les téléphones désinscrits sont oubliés.

Fichiers : `supabase/maj-coalition-et-rappels.sql`, `supabase/functions/envoyer-rappels/` (`index.ts` et
`rappel.ts`), `public/sw.js`, `src/data/rappels.ts`, `src/components/Rappels.tsx`.

## Mise en place (une seule fois, environ 10 minutes)

Les clés `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `CLE_ESSAI` ont été remises à part. **La clé
privée et la clé d’essai ne doivent jamais être publiées** (ni dans le site, ni dans GitHub).
La clé publique est aussi dans `src/config.ts` : les deux doivent être identiques.

### 1. Créer la fonction d’envoi

1. Supabase › **Edge Functions** › **Deploy a new function** › **Via Editor**.
2. Nom de la fonction : `envoyer-rappels`.
3. Remplacer **tout** le contenu du fichier `index.ts` par celui de
   `supabase/functions/envoyer-rappels/tout-en-un.ts` (version en un seul fichier, rien d’autre à
   ajouter).
4. (Version en deux fichiers, au choix : `index.ts` + un fichier `rappel.ts`.)
5. **Deploy function**.
6. Dans les réglages de la fonction (**Details** ou **Settings**), **désactiver** l’option
   « Verify JWT » / « Enforce JWT verification », puis enregistrer. La fonction ne fait rien en
   dehors des créneaux prévus : l’appeler en trop est sans effet.

### 2. Enregistrer les clés

Supabase › **Edge Functions** › **Secrets** › ajouter les trois secrets, nom et valeur :
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CLE_ESSAI`.

### 3. Créer les tables et la tâche programmée

Supabase › **SQL Editor** › **nouvel onglet vide** › coller tout `supabase/maj-coalition-et-rappels.sql` › **Run**.

### 4. Essayer

1. Sur le téléphone : ouvrir Team Ulysse (depuis l’icône sur iPhone), toucher **« Je te
   préviens ? »** sur le menu, puis **Activer les rappels** et **Autoriser**.
2. Supabase › Edge Functions › `envoyer-rappels` › **Test** (ou « Invoke ») avec le corps :

   ```json
   { "essai": "colle-ici-la-CLE_ESSAI" }
   ```

3. La notification « ✅ Les rappels Team Ulysse fonctionnent ! » arrive sur le téléphone.

Le mode essai envoie à **tous les téléphones abonnés** : à utiliser avant la diffusion de l’appli.

## Modifier les textes ou les heures

- Textes et créneaux : `supabase/functions/envoyer-rappels/rappel.ts` (puis redéployer la fonction).
- Heures d’appel (UTC) : la tâche `team-ulysse-rappels` à la fin de `supabase/maj-coalition-et-rappels.sql`.
- Arrêter tous les rappels : `select cron.unschedule('team-ulysse-rappels');` dans le SQL Editor.

## Notification de la personne tirée au sort

À chaque tirage (espace administrateur › Tirage), la personne tirée au sort reçoit sur ses
téléphones : « 🎁 Tu as été tiré(e) au sort ! C’est toi le gagnant du N décembre ! Réussis le défi
du jour pour remporter ton cadeau. » Un appui ouvre la case du jour.

- En décembre, le message part **le jour même** du tirage, jamais en avance (un tirage fait la veille
  pour le lendemain part le lendemain matin, avec les rappels). Hors décembre, il part tout de
  suite (pratique pour un essai).
- Un nouveau tirage (« refaire ») prévient le nouveau gagnant ; une annulation retire l’envoi prévu.
- Seules les personnes qui ont **activé les rappels** peuvent être prévenues ; leur téléphone est
  relié à leur inscription automatiquement à l’ouverture de l’appli.

Le même fichier SQL ajoute les **résultats à distance** : quand un collaborateur termine la case
d’un jour, son résultat (étoiles, détail de chaque jeu, 1er essai et meilleur score) est envoyé à la
base. Espace administrateur › onglet **Résultats** : pour chaque jour, la personne tirée au sort et
son verdict (« Défi réussi » dès 1 étoile, « Défi raté », « Pas encore joué »), puis la liste de tous
les joueurs du jour. La page s’actualise toute seule toutes les 30 secondes.

Mise en place, une fois :

1. Supabase › SQL Editor › nouvel onglet vide › coller `supabase/maj-gagnant-et-resultats.sql` › **Run**.
2. Supabase › Edge Functions › `envoyer-rappels` › remplacer tout le code par
   `supabase/functions/envoyer-rappels/tout-en-un.ts` › **Deploy**.

## Compte à rebours avant le calendrier

De J-7 à J-1 avant le 1er décembre, à 7 h 30 (heure de Paris), les téléphones abonnés au rappel
« Case du jour à ouvrir » reçoivent une notification (« ⏳ J-7 avant le calendrier de l’Avent ! »,
« 🎄 J-6 : Ulysse prépare les cases… », etc.). Pas le week-end : en 2026, J-7 (mardi 24) à J-4
(vendredi 27), puis J-1 (lundi 30). Le jour J, c’est la notification habituelle de la case du 1er.
Rien à faire dans la base : c’est la fonction `envoyer-rappels` (tout-en-un.ts) qui s’en charge.

**Test administrateur :** Espace administrateur › « Tester le compte à rebours » › « Recevoir le
test ». Les 6 notifications arrivent d’un coup sur ce téléphone uniquement (rappels activés
dessus), les collaborateurs ne reçoivent rien.
