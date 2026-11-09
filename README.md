# Vigie : un pack par jour, cinq règles de sécurité

Jeu de cartes à collectionner pour sensibiliser l’équipe à la sécurité au travail. Chaque jour,
chaque collaborateur ouvre un pack de 5 cartes de raretés différentes et complète sa collection.
Au verso de chaque carte : Ulysse, notre mascotte.

**Aperçu en ligne :** https://lucas6975.github.io/collection_cartes/

## Le jeu

- **Accueil** : le pack du jour à ouvrir, un résumé de ma collection, les participants actifs.
- **Pack du jour** : un seul par jour (il se renouvelle à minuit), 5 cartes, la dernière au moins peu commune. Animation d’ouverture, puis on retourne les cartes une à une.
- **Ma collection** : 30 cartes en 5 familles (incendie, EPI, risques, gestes et postures, procédures). Les cartes manquantes montrent leur verso ; les doublons sont comptés (×2, ×3…). Filtres, tri et recherche.
- **Participants actifs** : collaborateurs ayant ouvert un pack ces 7 derniers jours, classés par nombre de cartes, avec leur série de jours consécutifs.

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

Choisissez **Camille Martin** sur l’écran de connexion : son pack du jour l’attend. Le bouton
« Pack bonus (démo) » permet d’ouvrir des packs supplémentaires pour tester.

## Scripts

| Commande          | Rôle                                             |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Serveur de développement                         |
| `npm run build`   | Vérification des types puis build de production  |
| `npm test`        | Tests du tirage des packs et des cartes          |
| `npm run lint`    | ESLint                                           |
| `npm run db:seed` | Régénère `supabase/seed.sql` à partir des cartes |
| `npm run test:db` | Teste la migration SQL sur un PostgreSQL local   |

## Architecture

```
src/
  domain/packs.ts   règles des packs (tirage, pack du jour, doublons, séries), testées
  content/          les 30 cartes et leurs sources
  data/             accès aux données (mode démo local) et données de démonstration
  components/       carte, verso à la mascotte, pack, animation d’ouverture
  pages/            connexion, accueil, collection
public/mascotte.webp  Ulysse
supabase/           schéma PostgreSQL et tirage côté serveur pour la production
```

En mode démo (l’aperçu GitHub Pages), tout est enregistré dans le navigateur. Pour un usage
réel, le tirage doit se faire sur le serveur : voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Aperçu GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie le site à chaque push. À activer une fois :
**Settings › Pages › Build and deployment › Source : GitHub Actions**.
