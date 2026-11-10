# Contribuer

## Ajouter ou modifier une carte

Les cartes sont définies dans `src/content/cards.ts`, les références réutilisables dans
`src/content/sources.ts`.

Règles à respecter :

- chaque carte cite **au moins une source** ;
- la **nature** est exacte : ne jamais présenter une recommandation comme une obligation ;
- chaque famille garde au moins une carte de chaque rareté (vérifié par les tests) ;
- les numéros vont de 1 à N sans trou.

## Avant d’ouvrir une pull request

```bash
npm run lint && npm run typecheck && npm test
```

Si vous modifiez `supabase/setup.sql`, rejouez `supabase/test.sql` sur une base PostgreSQL de test.
