// Contenu du calendrier de l'Avent IMECA 2026, repris du document « CALENDRIER DE L'AVENT V1 »
// de la Team Ulysse. Les jours sans jeu sont à compléter : il suffit de remplir `jeux`.

import type { JourAvent } from './types';
import { estOuverte, jourJouable } from './logic';

const img = (nom: string) => `${import.meta.env.BASE_URL}avent/${nom}`;

/** Année du calendrier : la case N s'ouvre le N décembre de cette année. */
export const ANNEE_AVENT = 2026;

/**
 * Phase de test : les jours déjà prêts sont ouverts tout de suite, quelle que soit la date.
 * Pour lancer le vrai calendrier de décembre, passer à `false` : les cases s'ouvriront alors
 * jour après jour, et les scores du test seront remis à zéro.
 */
export const PHASE_TEST = true;

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
    jour: 5,
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
    jour: 6,
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
    jour: 7,
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
    jour: 8,
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
    jour: 9,
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
    jour: 10,
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
      {
        type: 'pendu',
        consigne: 'Bonus : le pendu d’Ulysse ! Trouve le mot avant de perdre tous tes casques.',
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
  { jour: 11, titre: 'Labyrinthe CACES', jeux: [] },
  { jour: 12, titre: 'Surprise', jeux: [] },
  { jour: 13, titre: 'Surprise', jeux: [] },
  { jour: 14, titre: 'Surprise', jeux: [] },
  { jour: 15, titre: 'Surprise', jeux: [] },
  { jour: 16, titre: 'Surprise', jeux: [] },
  { jour: 17, titre: 'Scènes choc IMECA', jeux: [] },
  { jour: 18, titre: 'Surprise', jeux: [] },
  { jour: 19, titre: 'Mots croisés sécurité', jeux: [] },
  { jour: 20, titre: 'Surprise', jeux: [] },
  { jour: 21, titre: 'Surprise', jeux: [] },
  { jour: 22, titre: 'Surprise', jeux: [] },
  { jour: 23, titre: 'Surprise', jeux: [] },
  { jour: 24, titre: 'Le grand jour', jeux: [] },
];

/** Une case est-elle ouverte ? (aperçu : tout ; test : les jours prêts ; sinon : selon la date) */
export function caseOuverte(jour: JourAvent, now: Date, apercu: boolean): boolean {
  if (apercu) return true;
  if (PHASE_TEST) return jourJouable(jour);
  return estOuverte(ANNEE_AVENT, jour.jour, now);
}
