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
- **Pack du jour** : un seul par jour (renouvelé à minuit), 5 cartes, la dernière au moins peu commune. Les cartes se révèlent une par une, en grand ; avant une carte rare ou mieux, le dos tremble et s’illumine. Un récap termine l’ouverture.
- **Ma collection** : 36 cartes. 30 cartes en 5 familles (incendie, EPI, risques, gestes et postures, procédures), les **5 règles qui sauvent la vie** d’IMECA (LSR, légendaires) et la carte secrète **Ulysse**, qui ne sort jamais d’un pack : elle se débloque quand on a réuni les 5 LSR. Les cartes manquantes montrent leur verso ; les doublons sont comptés (×2, ×3…). Filtres, tri et recherche.

### Où est enregistrée la collection ?

Dans le navigateur de chaque personne (stockage local), sans compte ni serveur. On retrouve sa
collection en revenant **sur le même appareil et le même navigateur**. En revanche :

- changer de téléphone, de navigateur, ou utiliser la navigation privée repart de zéro ;
- effacer les données du site dans les réglages du navigateur efface la collection ;
- sur iPhone, Safari peut effacer les données d’un site non visité pendant 7 jours : ajouter le site à l’écran d’accueil (Partager › Sur l’écran d’accueil) évite ce cas.

Un classement entre collègues ou une collection retrouvable sur plusieurs appareils demandera un
serveur (voir `docs/ARCHITECTURE.md`) : ce sera la seconde étape si le jeu prend.

### Calendrier de l’Avent

Un défi par jour ouvré du 1er au 24 décembre 2026 (pas de week-end : ni le 5, 6, 12, 13, 19 et 20) ;
la case N s’ouvre le N décembre à minuit. Chaque défi rapporte de 0 à 3 étoiles. Les types de jeu
alternent pour ne jamais avoir deux jours de suite le même :

| Jour | Défi                                                 | Origine       |
| ---- | ---------------------------------------------------- | ------------- |
| 1    | Trouver les 5 anomalies (cariste)                    | calendrier V1 |
| 2    | Remettre la consigne dans l’ordre (sous-traitant)    | calendrier V1 |
| 3    | Quiz SST et premiers secours                         | calendrier V1 |
| 4    | Associer les pictogrammes aux dangers                | calendrier V1 |
| 7    | Vrai ou faux                                         | calendrier V1 |
| 8    | Remettre dans l’ordre : LOTOTO                       | calendrier V1 |
| 9    | Memory des EPI                                       | nouveau       |
| 10   | Le pendu d’Ulysse                                    | nouveau       |
| 11   | Remettre dans l’ordre : trafic                       | calendrier V1 |
| 14   | Trouve l’intrus                                      | nouveau       |
| 15   | Remettre dans l’ordre : DATI                         | calendrier V1 |
| 16   | Mots mêlés sécurité                                  | nouveau       |
| 17   | Scène choc à IMECA (en vrai, pas de jeu)             | interne       |
| 18   | Remettre dans l’ordre : permis de feu                | calendrier V1 |
| 21   | Le grand tri (protection collective ou individuelle) | nouveau       |
| 22   | Trouve l’erreur dans la consigne                     | nouveau       |
| 23   | Remettre dans l’ordre : CACES pont roulant           | calendrier V1 |
| 24   | Le grand quiz de Noël (révision)                     | nouveau       |

**Le 17 décembre** est le seul jour sans jeu : la Team Ulysse prépare une scène choc réelle sur site
et la personne tirée au sort ce jour-là vient intervenir. Les autres y trouvent Ulysse en Père Noël,
une anecdote (la pyramide de Heinrich) et un petit défi à faire à leur poste.

**Ouverture :** pour les collaborateurs, les cases restent fermées jusqu’au N décembre, avec un
compte à rebours avant la première. L’administrateur (code saisi sur son téléphone) a accès à toutes
les cases en avance pour présenter le calendrier ; ses étoiles ne sont pas enregistrées et un bouton
les remet à zéro.

**Ajouter un défi :** remplissez `jeux` du jour concerné dans `src/avent/jours.ts`, en vous
inspirant des jours déjà faits (types : `anomalies`, `ordre`, `quiz`, `association`, `vraifaux`,
`pendu`). Les images vont dans `public/avent/`.

### Raretés

| Rareté      | Probabilité par emplacement | Finition          |
| ----------- | --------------------------- | ----------------- |
| Commune     | 52 %                        | Bordure sobre     |
| Peu commune | 27 %                        | Bordure bleue     |
| Rare        | 12 %                        | Finition argentée |
| Épique      | 5 %                         | Finition dorée    |
| Légendaire  | 4 %                         | Finition irisée   |

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
