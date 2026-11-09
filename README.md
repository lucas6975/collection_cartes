# Vigie : la sécurité au travail, une carte à la fois

Plateforme web gamifiée pour apprendre et retenir les règles de sécurité en entreprise. Les
collaborateurs gagnent des cartes à collectionner en répondant à des quiz, en réussissant des
mises en situation et en validant des parcours thématiques. La direction suit la progression et
repère les domaines à renforcer.

**Aperçu en ligne :** https://lucas6975.github.io/collection_cartes/ (après activation de GitHub
Pages, voir plus bas).

## Fonctionnalités

| Espace         | Contenu                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil        | Niveau, XP, défi du jour, dernières cartes, progression par famille, classement                                                                                                  |
| Ma collection  | Album de 30 cartes en 5 familles et 5 raretés, filtres, tri, recherche, cartes verrouillées avec indice d’obtention, vue détaillée (« Le savais-tu ? », « À retenir », sources)  |
| Apprendre      | Parcours thématiques (seuil de 80 %), file de révision des questions échouées                                                                                                    |
| Défis          | Défi du jour, mises en situation interactives, objectifs                                                                                                                         |
| Classement     | Hebdomadaire, général, par service (moyenne par membre)                                                                                                                          |
| Profil         | Maîtrise par domaine, progression par catégorie, succès, historique                                                                                                              |
| Administration | Tableau de bord direction (filtres service, équipe, période), collaborateurs, cartes (avec import d’illustration et aperçu en direct), quiz et parcours, validation des contenus |

### Règles de progression

- Une bonne réponse rapporte 10 XP **uniquement la première fois** : rejouer un quiz déjà maîtrisé ne rapporte rien.
- Parcours validé : +50 XP et une carte rare. Mise en situation réussie sans faute : +40 XP et une carte épique.
- Défi du jour réussi (3 bonnes réponses sur 4) : +30 XP, une fois par jour.
- Famille complétée : +100 XP. La carte légendaire récompense une famille entièrement collectionnée.
- Les erreurs alimentent une file de révision.

## Fiabilité des contenus

Chaque carte, question et mise en situation porte :

- une **nature** : obligation réglementaire, norme technique, recommandation de prévention ou pratique interne ;
- une ou plusieurs **sources** (INRS, Code du travail, règlements européens, normes) ;
- un **statut de vérification** avec la date et le nom du vérificateur.

> ⚠️ Les 30 cartes, 30 questions et 5 mises en situation fournies sont des **contenus de
> démonstration non vérifiés**. Ils ont été rédigés à partir de références connues, mais les sources
> n’ont pas pu être consultées en ligne lors de la rédaction. Le référent sécurité doit contrôler
> chaque élément dans l’espace **Administration › Validation** avant tout usage réel.

Toute modification d’un contenu le repasse « à vérifier ». Un contenu nouveau ou modifié ne peut
être publié qu’après vérification.

## Démarrage

Prérequis : Node.js 22 (voir `.nvmrc`).

```bash
npm install
npm run dev
```

Sur l’écran de connexion, choisissez **Camille Martin** (collaboratrice) ou **Nathalie Durand**
(administratrice). En mode démonstration, les données sont stockées dans le navigateur ; un bouton
de l’écran Validation permet de les réinitialiser.

## Scripts

| Commande          | Rôle                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Serveur de développement                                             |
| `npm run build`   | Vérification des types puis build de production                      |
| `npm test`        | Tests du moteur de jeu et de cohérence des contenus                  |
| `npm run lint`    | ESLint                                                               |
| `npm run db:seed` | Régénère `supabase/seed.sql` à partir des contenus TypeScript        |
| `npm run test:db` | Teste la migration SQL et les règles serveur sur un PostgreSQL local |

## Architecture

```
src/
  domain/        modèle de données et moteur de jeu (règles pures, testées)
  content/       contenus pédagogiques : cartes, questions, scénarios, sources
  data/          accès aux données (mode démo local), données de démonstration, statistiques
  components/    cartes à collectionner, mise en page, composants d’interface
  pages/         pages collaborateur et pages d’administration
supabase/
  migrations/    schéma PostgreSQL, sécurité par ligne, fonctions de jeu côté serveur
  tests/         scénarios de test SQL (triche, règles, validation)
```

Pile : React 19, TypeScript, Vite, Tailwind CSS 4, Motion (animations), Recharts (graphiques de
l’espace admin, chargés à la demande).

Détails : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Aperçu GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push. Il faut
l’activer une fois : **Settings › Pages › Build and deployment › Source : GitHub Actions**.

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md).
