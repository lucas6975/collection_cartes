// Contenu du calendrier de l'Avent IMECA 2026 : un défi par jour ouvré (pas de week-end).
// Jeux de base repris du document « CALENDRIER DE L'AVENT V1 » de la Team Ulysse (jours 1, 2, 3,
// 4, 7, 8, 10, 11, 15, 18 et 23), complétés par de nouveaux jeux. L'ordre alterne les types de jeu.

import type { JourAvent } from './types';
import { estOuverte } from './logic';

const img = (nom: string) => `${import.meta.env.BASE_URL}avent/${nom}`;

/** Année du calendrier : la case N s'ouvre le N décembre de cette année. */
export const ANNEE_AVENT = 2026;

export const JOURS: JourAvent[] = [
  {
    jour: 1,
    titre: 'Trouve les 4 anomalies',
    lsr: 'Selon nos LSR',
    jeux: [
      {
        type: 'anomalies',
        consigne: 'Touche l’image là où tu repères une erreur. Il y en a 4 à trouver !',
        image: img('jour1-cariste.webp'),
        ratio: 727 / 978,
        anomalies: [
          { id: 'telephone', label: 'Utilisation du téléphone', cibles: [{ x: 69, y: 35, r: 8 }] },
          {
            id: 'epi',
            label: 'Non port des EPI (gilet haute visibilité + chaussures de sécurité)',
            cibles: [
              { x: 62, y: 44, r: 8 },
              { x: 55, y: 71, r: 7 },
            ],
          },
          {
            id: 'ceinture',
            label: 'Non respect du port de la ceinture',
            cibles: [{ x: 63, y: 55, r: 6 }],
          },
          {
            id: 'allee',
            label: 'Allée encombrée',
            cibles: [
              { x: 89, y: 51, r: 11 },
              { x: 90, y: 92, r: 9 },
            ],
          },
        ],
      },
    ],
  },
  {
    jour: 2,
    titre: 'Remettre la consigne dans l’ordre',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Un sous-traitant doit remplacer un moteur sur une machine de production. Voici les actions qui ont été réalisées, mais dans le désordre.',
        consigne: 'Remets-les dans l’ordre logique pour garantir la sécurité de l’intervention.',
        etapes: [
          'Prendre connaissance des consignes sécurité du site (Cikaba)',
          'Vérifier les autorisations nécessaires (plan de prévention, habilitations / formations)',
          'Prendre connaissance des risques de la zone et des mesures de prévention',
          'Vérifier que les outils et EPI sont adaptés',
          'Réaliser l’intervention',
          'Effectuer le repli de chantier et rendre la zone sûre',
        ],
      },
    ],
  },
  {
    jour: 3,
    titre: 'Quiz SST et premiers secours',
    jeux: [
      {
        type: 'quiz',
        consigne: 'Choisis la bonne réponse à chaque question.',
        questions: [
          {
            question: 'L’utilisation du défibrillateur au sein d’IMECA peut se faire par :',
            choix: ['Les SST formés uniquement', 'Tous les salariés'],
            bonne: 1,
          },
          {
            question: 'Lors d’un arrêt cardiaque, le DAE annonce : « choc non recommandé ».',
            choix: [
              'J’arrête immédiatement la réanimation',
              'Je reprends immédiatement les compressions thoraciques',
            ],
            bonne: 1,
          },
          {
            question:
              'Une victime ne répond pas. Vous observez quelques mouvements du thorax et des « gasps » (respiration agonique).',
            choix: [
              'Considérer que la victime ne respire pas normalement et commencer le massage cardiaque',
              'Mettre la victime en position latérale de sécurité',
            ],
            bonne: 0,
          },
          {
            question: 'Une victime inconsciente est retrouvée allongée par terre.',
            choix: [
              'Je vérifie immédiatement sa respiration',
              'Je libère les voies aériennes pour vérifier sa respiration',
            ],
            bonne: 1,
          },
        ],
      },
    ],
  },
  {
    jour: 4,
    titre: 'Associer les pictogrammes aux bons dangers',
    jeux: [
      {
        type: 'association',
        consigne: 'Touche un danger, puis le pictogramme qui lui correspond.',
        paires: [
          { image: img('picto-comburant.webp'), label: 'Matières comburantes' },
          { image: img('picto-electrique.webp'), label: 'Risque électrique' },
          { image: img('picto-atex.webp'), label: 'Atmosphère explosive' },
          { image: img('picto-nocif.webp'), label: 'Nocif ou irritant' },
          { image: img('picto-corrosif.webp'), label: 'Corrosif' },
          { image: img('picto-aquatique.webp'), label: 'Danger pour les milieux aquatiques' },
          { image: img('picto-acces-restreint.webp'), label: 'Accès restreint' },
        ],
      },
    ],
  },
  {
    jour: 7,
    titre: 'Vrai ou faux',
    jeux: [
      {
        type: 'vraifaux',
        consigne:
          'Vrai ou faux ? Réponds avec les boutons, ou fais glisser la carte à droite (vrai) ou à gauche (faux).',
        questions: [
          {
            affirmation: 'La plupart des accidents surviennent lors d’opérations inhabituelles.',
            reponse: false,
          },
          {
            affirmation: 'À IMECA, le piéton est prioritaire vis-à-vis des engins.',
            reponse: false,
          },
          { affirmation: 'Une zone bien rangée est forcément une zone plus sûre.', reponse: false },
          {
            affirmation:
              'Être interrompu pendant une tâche augmente le risque d’erreur lors de la reprise.',
            reponse: true,
          },
          {
            affirmation:
              'La réduction de l’accidentologie est une preuve que les risques et moyens de prévention associés sont maîtrisés et adaptés.',
            reponse: true,
          },
        ],
      },
    ],
  },
  {
    jour: 8,
    titre: 'Remettre la consigne dans l’ordre',
    lsr: 'LSR n°3 : LOTOTO',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Un salarié IMECA doit intervenir sur un capteur défectueux d’une machine de production. Il ne se souvient plus des étapes pour réaliser la consignation en toute sécurité.',
        consigne: 'Aide-le à remettre ces actions dans le bon ordre !',
        etapes: [
          'Informer les personnes concernées de l’intervention',
          'Identifier les sources d’énergies dangereuses',
          'Poser son cadenas de consignation (LOTOTO)',
          'Vérifier l’absence d’énergie (électrique)',
          'Réaliser l’intervention',
          'Remettre l’installation en service et informer les utilisateurs',
        ],
      },
    ],
  },
  {
    jour: 9,
    titre: 'Memory des EPI',
    jeux: [
      {
        type: 'memory',
        consigne:
          'Retourne les cartes deux par deux : associe chaque équipement au risque dont il te protège.',
        paires: [
          { icone: 'HardHat', nom: 'Casque', associe: 'Chutes d’objets et chocs à la tête' },
          { icone: 'Glasses', nom: 'Lunettes', associe: 'Projections dans les yeux' },
          { icone: 'Ear', nom: 'Protections auditives', associe: 'Bruit' },
          { icone: 'Hand', nom: 'Gants', associe: 'Coupures et brûlures des mains' },
          { icone: 'Footprints', nom: 'Chaussures de sécurité', associe: 'Écrasement des pieds' },
          {
            icone: 'Shirt',
            nom: 'Gilet haute visibilité',
            associe: 'Ne pas être vu par les engins',
          },
        ],
      },
    ],
  },
  {
    jour: 10,
    titre: 'Le pendu d’Ulysse',
    jeux: [
      {
        type: 'pendu',
        consigne: 'Trouve le mot avant de perdre tous tes casques !',
        mots: [
          {
            mot: 'LOTOTO',
            indice: 'Le cadenas que l’on pose pour consigner une machine (LSR n°3)',
          },
          { mot: 'PERMIS DE FEU', indice: 'Document signé avant des travaux par point chaud' },
          { mot: 'DEFIBRILLATEUR', indice: 'À IMECA, tous les salariés peuvent l’utiliser' },
          {
            mot: 'PLAN DE PREVENTION',
            indice: 'Rédigé avec l’entreprise extérieure avant les travaux',
          },
          { mot: 'CEINTURE', indice: 'Le cariste la porte avant de démarrer' },
          { mot: 'CACES', indice: 'Certificat à vérifier avant d’utiliser un pont roulant' },
        ],
      },
    ],
  },
  {
    jour: 11,
    titre: 'Remettre la consigne dans l’ordre',
    lsr: 'LSR n°4 : trafic',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Tu prends ton poste de cariste et dois réaliser plusieurs manutentions dans une zone de cohabitation entre piétons, véhicules et chariots (CEF).',
        consigne: 'Remets les actions dans le bon ordre afin de respecter la LSR « trafic » !',
        etapes: [
          'Réaliser les contrôles de prise de poste du CEF (PV1)',
          'Porter la ceinture de sécurité',
          'Vérifier l’absence de piétons et son environnement avant de démarrer',
          'Klaxonner à l’approche d’une intersection ou d’une zone à visibilité réduite',
          'Réaliser la manutention en respectant les marquages et les zones de cohabitation',
          'En fin d’activité, stationner le CEF dans l’emplacement prévu et en sécurité',
        ],
      },
    ],
  },
  {
    jour: 14,
    titre: 'Trouve l’intrus',
    jeux: [
      {
        type: 'intrus',
        consigne: 'Dans chaque série, un élément n’a rien à faire là. Trouve-le !',
        series: [
          {
            elements: ['Casque', 'Gants', 'Lunettes', 'Garde-corps'],
            intrus: 3,
            explication:
              'Le garde-corps est une protection collective ; les trois autres sont des équipements de protection individuelle.',
          },
          {
            elements: ['Eau pulvérisée', 'CO2', 'Poudre', 'Huile'],
            intrus: 3,
            explication: 'L’huile est un combustible : elle alimente le feu au lieu de l’éteindre.',
          },
          {
            elements: [
              'Rouge : interdiction',
              'Bleu : obligation',
              'Vert : secours',
              'Violet : danger',
            ],
            intrus: 3,
            explication:
              'Le violet n’est pas une couleur de signalisation de sécurité : un danger se signale en jaune.',
          },
          {
            elements: ['Inflammable', 'Corrosif', 'Toxique', 'Recyclable'],
            intrus: 3,
            explication:
              '« Recyclable » n’est pas un danger : les trois autres sont des pictogrammes de danger des produits chimiques.',
          },
          {
            elements: [
              'Consigner',
              'Poser son cadenas',
              'Vérifier l’absence d’énergie',
              'Retirer le protecteur pour aller plus vite',
            ],
            intrus: 3,
            explication:
              'On ne neutralise jamais un protecteur ; les trois autres sont des étapes de la consignation (LOTOTO).',
          },
        ],
      },
    ],
  },
  {
    jour: 15,
    titre: 'Remettre la consigne dans l’ordre',
    lsr: 'LSR n°2 : intégrité des dispositifs de sécurité',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Lors de l’inspection commune et de la rédaction du plan de prévention, le risque de travailleur isolé est identifié pour une intervention.',
        consigne:
          'Remets les actions dans le bon ordre afin de respecter la LSR « intégrité des dispositifs de sécurité » !',
        etapes: [
          'Lors de l’inspection commune et du plan de prévention, le risque de travailleur isolé est identifié',
          'Le service EP ou le responsable de l’intervention fournit le DATI et explique son fonctionnement',
          'Porter le DATI durant toute la durée de l’intervention',
          'Réaliser l’intervention',
          'Signaler au service EP ou au responsable d’intervention si l’intervention se prolonge, afin de mettre à jour la chaîne d’appel si nécessaire',
        ],
      },
    ],
  },
  {
    jour: 16,
    titre: 'Mots mêlés sécurité',
    jeux: [
      {
        type: 'motsmeles',
        consigne:
          'Retrouve les 8 mots de la sécurité cachés dans la grille (de gauche à droite, de haut en bas ou en diagonale).',
        taille: 10,
        mots: ['CASQUE', 'GANTS', 'LUNETTES', 'EXTINCTEUR', 'LOTOTO', 'CEINTURE', 'ALARME', 'DATI'],
      },
    ],
  },
  {
    jour: 17,
    titre: 'Scènes chocs à IMECA',
    jeux: [
      {
        type: 'scenes',
        consigne: 'Cinq scènes qui auraient pu mal tourner. À chaque fois, choisis le bon réflexe.',
        scenes: [
          {
            situation:
              'Un collègue est allongé au sol, immobile, devant une armoire électrique ouverte.',
            options: [
              {
                texte: 'Je le secoue pour le réveiller',
                correct: false,
                consequence:
                  'S’il est encore en contact avec le courant, tu risques d’être électrisé à ton tour.',
              },
              {
                texte: 'Je fais couper le courant sans m’exposer, puis j’alerte les secours',
                correct: true,
                consequence:
                  'Protéger, alerter, secourir : on supprime d’abord le danger, sans se mettre soi-même en danger.',
              },
              {
                texte: 'Je vais chercher de l’eau pour le ranimer',
                correct: false,
                consequence:
                  'L’eau et l’électricité font très mauvais ménage, et l’urgence est d’alerter.',
              },
            ],
          },
          {
            situation:
              'Un chariot recule dans une allée. Un piéton, casque audio sur les oreilles, traverse juste derrière sans regarder.',
            options: [
              {
                texte: 'Je crie et je fais signe au cariste et au piéton pour qu’ils s’arrêtent',
                correct: true,
                consequence:
                  'Alerter tout de suite peut éviter la collision. Le piéton doit ensuite emprunter les allées piétonnes.',
              },
              {
                texte: 'Je ne dis rien, le cariste a sûrement vu',
                correct: false,
                consequence:
                  'En marche arrière, la visibilité est réduite : il ne faut jamais compter sur la chance.',
              },
              {
                texte: 'Je sors mon téléphone pour filmer',
                correct: false,
                consequence: 'Chaque seconde compte : il faut alerter, pas filmer.',
              },
            ],
          },
          {
            situation:
              'De la fumée sort sous la porte d’un local de stockage. L’alarme ne s’est pas déclenchée.',
            options: [
              {
                texte: 'J’ouvre la porte en grand pour voir ce qui se passe',
                correct: false,
                consequence: 'L’appel d’air peut attiser le feu et t’exposer aux fumées.',
              },
              {
                texte: 'J’attends de voir si ça s’aggrave',
                correct: false,
                consequence:
                  'Un feu double de taille très vite : attendre fait perdre un temps précieux.',
              },
              {
                texte: 'Je déclenche l’alarme et je préviens les secours selon la consigne',
                correct: true,
                consequence:
                  'Donner l’alerte immédiatement permet d’évacuer et d’intervenir tant que le feu est petit.',
              },
            ],
          },
          {
            situation:
              'Un intérimaire grimpe sur les fourches d’un chariot élévateur pour attraper un carton en hauteur.',
            options: [
              {
                texte: 'Je lui demande de descendre immédiatement et je le signale',
                correct: true,
                consequence:
                  'Les fourches ne sont pas faites pour lever des personnes : la chute peut être grave.',
              },
              {
                texte: 'Je tiens le chariot pour qu’il reste stable',
                correct: false,
                consequence:
                  'Tu cautionnes une situation dangereuse sans réduire le risque de chute.',
              },
              {
                texte: 'Ce n’est pas mon problème',
                correct: false,
                consequence:
                  'La sécurité, c’est l’affaire de tous : laisser faire, c’est laisser l’accident arriver.',
              },
            ],
          },
          {
            situation: 'Une flaque d’un produit inconnu s’étend sous un fût percé.',
            options: [
              {
                texte: 'J’éponge à mains nues avec un chiffon',
                correct: false,
                consequence:
                  'Un produit inconnu peut être corrosif ou toxique : jamais de contact sans protection.',
              },
              {
                texte:
                  'Je balise la zone, je préviens mon responsable et on consulte la fiche de données de sécurité',
                correct: true,
                consequence:
                  'On isole le danger, on alerte, et la FDS indique comment intervenir et avec quels EPI.',
              },
              {
                texte: 'Je passe à côté en faisant attention',
                correct: false,
                consequence: 'D’autres risquent de glisser ou d’être exposés : il faut signaler.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    jour: 18,
    titre: 'Remettre la consigne dans l’ordre',
    lsr: 'LSR n°5 : interventions spécifiques',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Une entreprise extérieure doit réaliser des travaux par point chaud (soudage / meulage) dans l’atelier.',
        consigne:
          'Remets les actions dans le bon ordre afin de respecter la LSR « interventions spécifiques » !',
        etapes: [
          'Réaliser une inspection commune préalable avec l’entreprise extérieure',
          'Rédiger le plan de prévention',
          'Mettre en place et / ou vérifier les moyens de prévention définis (extincteurs, balisage, masque soudure…)',
          'Rédiger et signer le permis de feu (par le RMT)',
          'Réaliser les travaux',
          'Réaliser la levée de doute de 30 minutes à 2 heures après la fin des travaux',
        ],
      },
    ],
  },
  {
    jour: 21,
    titre: 'Le grand tri',
    jeux: [
      {
        type: 'tri',
        consigne:
          'Range chaque protection dans le bon bac : protège-t-elle tout le monde (collective) ou seulement celui qui la porte (individuelle) ?',
        bacs: ['Protection collective', 'Protection individuelle'],
        elements: [
          {
            texte: 'Garde-corps',
            bac: 0,
            explication: 'Il protège toutes les personnes présentes sur la zone.',
          },
          { texte: 'Casque', bac: 1, explication: 'Il ne protège que celui qui le porte.' },
          {
            texte: 'Aspiration des fumées',
            bac: 0,
            explication: 'Elle capte les polluants à la source, pour tout l’atelier.',
          },
          {
            texte: 'Bouchons d’oreilles',
            bac: 1,
            explication: 'Ils protègent seulement celui qui les porte.',
          },
          {
            texte: 'Carter de machine',
            bac: 0,
            explication: 'Il empêche quiconque d’atteindre les pièces en mouvement.',
          },
          {
            texte: 'Harnais antichute',
            bac: 1,
            explication: 'Il protège uniquement la personne qui l’utilise.',
          },
          {
            texte: 'Balisage de zone',
            bac: 0,
            explication: 'Il tient tout le monde à distance du danger.',
          },
          {
            texte: 'Lunettes de protection',
            bac: 1,
            explication: 'Elles protègent les yeux de celui qui les porte.',
          },
        ],
      },
    ],
  },
  {
    jour: 22,
    titre: 'Trouve l’erreur dans la consigne',
    jeux: [
      {
        type: 'erreur',
        consigne: 'Chaque consigne contient une phrase dangereuse. Repère-la !',
        consignes: [
          {
            titre: 'Évacuation incendie',
            phrases: [
              'Je suis le balisage vers la sortie la plus proche.',
              'Je prends l’ascenseur pour aller plus vite.',
              'Je referme les portes derrière moi.',
              'Je rejoins le point de rassemblement.',
            ],
            erreur: 1,
            explication:
              'En cas d’incendie, on n’utilise jamais l’ascenseur : il peut tomber en panne ou mener vers les fumées.',
          },
          {
            titre: 'Extincteur CO2',
            phrases: [
              'Je vérifie sur l’étiquette que l’extincteur convient au feu.',
              'Je tiens l’extincteur par le diffuseur.',
              'Je vise la base des flammes.',
              'J’aère le local après utilisation.',
            ],
            erreur: 1,
            explication:
              'Le diffuseur d’un extincteur CO2 devient glacial : on le tient par la poignée pour éviter les brûlures par le froid.',
          },
          {
            titre: 'Port de charge',
            phrases: [
              'Je rapproche la charge de mon corps.',
              'Je plie les jambes en gardant le dos droit.',
              'Je tourne le buste pour déposer la charge.',
              'Je demande de l’aide si la charge est trop lourde.',
            ],
            erreur: 2,
            explication: 'Tourner le buste en portant abîme le dos : on pivote avec les pieds.',
          },
          {
            titre: 'Produits chimiques',
            phrases: [
              'Je lis l’étiquette avant d’utiliser le produit.',
              'Je porte les EPI indiqués dans la fiche de données de sécurité.',
              'Je transvase le produit dans une bouteille d’eau vide.',
              'Je referme bien le contenant après usage.',
            ],
            erreur: 2,
            explication:
              'Jamais de produit chimique dans un contenant alimentaire : quelqu’un pourrait le boire par erreur.',
          },
        ],
      },
    ],
  },
  {
    jour: 23,
    titre: 'Remettre la consigne dans l’ordre',
    lsr: 'LSR n°1 : formations & autorisations',
    jeux: [
      {
        type: 'ordre',
        contexte:
          'Un nouveau salarié est embauché chez IMECA. Il devra utiliser le pont roulant dans le cadre de ses missions.',
        consigne:
          'Remets les actions dans le bon ordre afin de respecter la LSR « formations & autorisations » !',
        etapes: [
          'Vérifier que le salarié possède un CACES valide (pont roulant)',
          'Vérifier que l’opérateur connaît les risques de sécurité du site et de la zone d’intervention',
          'Établir une autorisation de conduite',
          'Faire signer l’autorisation de conduite par la direction ou la RGEP',
          'Réaliser l’opération d’utilisation du pont roulant',
        ],
      },
    ],
  },
  {
    jour: 24,
    titre: 'Le grand quiz de Noël',
    jeux: [
      {
        type: 'quiz',
        consigne: 'Dernière case ! Six questions pour réviser tout le calendrier.',
        questions: [
          {
            question: 'Qui peut utiliser le défibrillateur au sein d’IMECA ?',
            choix: [
              'Les SST formés uniquement',
              'Tous les salariés',
              'Personne sans l’accord du médecin',
            ],
            bonne: 1,
          },
          {
            question: 'Quelle est la première étape d’une consignation (LOTOTO) ?',
            choix: [
              'Poser son cadenas',
              'Informer les personnes concernées de l’intervention',
              'Réaliser l’intervention',
            ],
            bonne: 1,
          },
          {
            question: 'Avant de démarrer son chariot, le cariste doit d’abord…',
            choix: [
              'Réaliser les contrôles de prise de poste (PV1)',
              'Klaxonner',
              'Stationner le chariot',
            ],
            bonne: 0,
          },
          {
            question: 'Après des travaux par point chaud, la levée de doute se fait…',
            choix: [
              'Juste avant de partir en week-end',
              'De 30 minutes à 2 heures après la fin des travaux',
              'Le lendemain matin',
            ],
            bonne: 1,
          },
          {
            question: 'À IMECA, le piéton est-il prioritaire vis-à-vis des engins ?',
            choix: ['Oui, toujours', 'Non'],
            bonne: 1,
          },
          {
            question: 'Que faut-il porter durant toute une intervention en travailleur isolé ?',
            choix: ['Un gilet haute visibilité', 'Le DATI', 'Un harnais'],
            bonne: 1,
          },
        ],
      },
    ],
  },
];

/**
 * Une case est-elle ouverte ? Pour les collaborateurs : à partir du N décembre.
 * L'administrateur a accès à toutes les cases en avance, pour présenter le calendrier.
 */
export function caseOuverte(jour: JourAvent, now: Date, admin: boolean): boolean {
  if (admin) return true;
  return estOuverte(ANNEE_AVENT, jour.jour, now);
}
