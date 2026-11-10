# Vigie : un pack par jour, cinq règles de sécurité

Jeu de cartes à collectionner pour sensibiliser l’équipe à la sécurité au travail. Chaque jour,
chaque collaborateur ouvre un pack de 5 cartes de raretés différentes et complète sa collection.
Au verso de chaque carte : Ulysse, notre mascotte.

**Aperçu en ligne :** https://lucas6975.github.io/collection_cartes/

## Inscriptions et tirage au sort

À la première ouverture, chacun saisit son **prénom et son nom** et choisit les jours où il veut être
tiré au sort (pas de mot de passe). L'administrateur entre avec un **code secret** : il voit la liste
des inscrits, lance le tirage de chaque jour (une personne gagne au plus une fois) et exporte la liste
pour Excel. Les inscriptions sont centralisées dans une base Supabase : voir
[`docs/SUPABASE.md`](docs/SUPABASE.md) pour la connecter. Tant qu'elle ne l'est pas, les inscriptions
restent sur chaque téléphone et sont envoyées dès la connexion.

## Les jeux

Le site s’ouvre sur un **menu** avec deux jeux.

### Cartes à collectionner

- **Pas de compte** : on ouvre le site et on joue. Chaque personne part de zéro.
- **Pack du jour** : un seul par jour (renouvelé à minuit), 5 cartes, la dernière au moins peu commune. Animation d’ouverture, puis on retourne les cartes une à une.
- **Ma collection** : 30 cartes en 5 familles (incendie, EPI, risques, gestes et postures, procédures). Les cartes manquantes montrent leur verso ; les doublons sont comptés (×2, ×3…). Filtres, tri et recherche.

### Où est enregistrée la collection ?

Dans le navigateur de chaque personne (stockage local), sans compte ni serveur. On retrouve sa
collection en revenant **sur le même appareil et le même navigateur**. En revanche :

- changer de téléphone, de navigateur, ou utiliser la navigation privée repart de zéro ;
- effacer les données du site dans les réglages du navigateur efface la collection ;
- sur iPhone, Safari peut effacer les données d’un site non visité pendant 7 jours : ajouter le site à l’écran d’accueil (Partager › Sur l’écran d’accueil) évite ce cas.

Un classement entre collègues ou une collection retrouvable sur plusieurs appareils demandera un
serveur (voir `docs/ARCHITECTURE.md`) : ce sera la seconde étape si le jeu prend.

### Calendrier de l’Avent

Une case par jour du 1er au 24 décembre 2026 ; la case N s’ouvre le N décembre à minuit.
Chaque case contient un défi tiré du calendrier IMECA de la Team Ulysse, avec des étoiles à gagner
(de 0 à 3) et la correction à la fin :

| Jour              | Défi                                                           |
| ----------------- | -------------------------------------------------------------- |
| 1                 | Trouver les 4 anomalies sur l’image (on touche l’image)        |
| 2, 6, 7, 8, 9, 10 | Remettre la consigne dans l’ordre (glisser-déposer ou flèches) |
| 3                 | Quiz SST et premiers secours                                   |
| 4                 | Associer les pictogrammes aux dangers                          |
| 5                 | Vrai ou faux (boutons ou carte à faire glisser)                |
| 10 (bonus)        | Pendu d’Ulysse                                                 |
| 11 à 24           | À préparer : la case affiche « le défi se prépare »            |

**Phase de test (actuelle) :** les jours déjà prêts (1 à 10) sont ouverts tout de suite pour
tout le monde. Pour lancer le vrai calendrier de décembre, passer `PHASE_TEST` à `false` dans
`src/avent/jours.ts` : les cases s’ouvriront alors jour après jour, et les scores du test seront
remis à zéro.

**Tout ouvrir pour vérifier :** ajoutez `?apercu` à l’adresse du calendrier
(`…/collection_cartes/#/avent?apercu`) pour ouvrir toutes les cases le temps de la visite.

**Ajouter un défi :** remplissez `jeux` du jour concerné dans `src/avent/jours.ts`, en vous
inspirant des jours déjà faits (types : `anomalies`, `ordre`, `quiz`, `association`, `vraifaux`,
`pendu`). Les images vont dans `public/avent/`.

### Raretés

| Rareté      | Probabilité par emplacement | Finition           |
| ----------- | --------------------------- | ------------------ |
| Commune     | 55 %                        | Bordure sobre      |
| Peu commune | 27 %                        | Bordure bleue      |
| Rare        | 12 %                        | Finition argentée  |
| Épique      | 5 %                         | Finition dorée     |
| Légendaire  | 1 %                         | Finition lumineuse |

Le 5ᵉ emplacement est toujours au moins peu commun. Les probabilités se règlent dans
`src/domain/packs.ts` (et dans la migration SQL pour la production).

## Contenu des cartes

Chaque carte présente une règle de sécurité : description, « Le savais-tu ? », « À retenir »,
nature de l’information (obligation réglementaire, norme, recommandation, pratique interne) et
sources.

> ⚠️ Les 30 cartes fournies sont des **contenus de démonstration non vérifiés** : les sources
> n’ont pas pu être consultées en ligne lors de la rédaction. Le référent sécurité doit les
> contrôler avant tout usage réel (fichier `src/content/cards.ts`).

## Démarrage

Prérequis : Node.js 22.

```bash
npm install
npm run dev
```

Le site s’ouvre directement sur le pack du jour. Pour repartir de zéro en développement, videz le
stockage local du site (clé `vigie-partie`).

## Scripts

| Commande        | Rôle                                            |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Serveur de développement                        |
| `npm run build` | Vérification des types puis build de production |
| `npm test`      | Tests du tirage des packs et des cartes         |
| `npm run lint`  | ESLint                                          |

## Architecture

```
src/
  domain/packs.ts   règles des packs (tirage, pack du jour, doublons, séries), testées
  content/          les 30 cartes et leurs sources
  data/store.ts     sauvegarde de la partie dans le navigateur
  components/       carte, verso à la mascotte, pack, animation d’ouverture
  pages/            menu, pack du jour, collection, calendrier de l’Avent
  avent/            contenu du calendrier, règles et mini-jeux
public/mascotte.webp  Ulysse
supabase/setup.sql  base des inscriptions et des tirages (à coller dans Supabase)
```

## Aperçu GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie le site à chaque push. À activer une fois :
**Settings › Pages › Build and deployment › Source : GitHub Actions**.
