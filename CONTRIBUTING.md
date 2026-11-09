# Contribuer

## Ajouter une carte

1. Créer un fichier `src/data/cards/<id>.json` (l'`id` en kebab-case, identique au nom du fichier).
2. Remplir les champs :

```json
{
  "id": "ransomware",
  "nom": "Rançongiciel",
  "categorie": "menace",
  "rarete": "epique",
  "description": "Logiciel malveillant qui chiffre les données et exige une rançon pour les restituer.",
  "aRetenir": "Des sauvegardes hors ligne et testées sont la meilleure assurance contre un rançongiciel.",
  "sources": ["https://cyber.gouv.fr/rancongiciels"],
  "tags": ["malware"]
}
```

| Champ         | Valeurs                                                          |
| ------------- | ---------------------------------------------------------------- |
| `categorie`   | `menace`, `defense`, `concept`, `outil`, `incident`              |
| `rarete`      | `commune`, `peu-commune`, `rare`, `epique`, `legendaire`         |
| `description` | 10 à 400 caractères                                              |
| `aRetenir`    | 10 à 300 caractères : le message clé pour l'équipe               |
| `sources`     | au moins une URL de référence (ANSSI, OWASP, MITRE ATT&CK, CVE…) |

3. Lancer `npm test` : le test vérifie que chaque carte respecte le schéma.

Le schéma complet est défini dans [`src/types/card.ts`](src/types/card.ts).

## Avant d'ouvrir une PR

```bash
npm run lint && npm run typecheck && npm test
```

La CI GitHub Actions lance les mêmes vérifications.
