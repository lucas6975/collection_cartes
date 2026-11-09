# Contribuer

## Ajouter ou modifier un contenu

En production, les contenus se gèrent depuis l’espace **Administration** (cartes, quiz,
parcours), puis sont vérifiés et publiés depuis **Validation**.

Les contenus de démonstration sont définis dans `src/content/` :

| Fichier        | Contenu                                              |
| -------------- | ---------------------------------------------------- |
| `cards.ts`     | Cartes : texte, rareté, icône, condition d’obtention |
| `questions.ts` | Questions : choix, bonne réponse, explication        |
| `scenarios.ts` | Mises en situation et parcours thématiques           |
| `sources.ts`   | Références réutilisables (INRS, Code du travail…)    |

Règles à respecter :

- chaque contenu cite **au moins une source** ;
- la **nature** est exacte : ne jamais présenter une recommandation comme une obligation ;
- un contenu ajouté arrive avec le statut « à vérifier ».

Après modification, régénérez le jeu de données SQL :

```bash
npm run db:seed
```

## Avant d’ouvrir une pull request

```bash
npm run lint && npm run typecheck && npm test
```

Si vous modifiez la migration SQL, lancez aussi `npm run test:db` (PostgreSQL local requis).
