import type { Source, Verification } from '../domain/types';

// Références réutilisées par les contenus de démonstration.
// IMPORTANT : ces contenus sont livrés avec le statut « à vérifier ». Un administrateur doit
// contrôler chaque information auprès de la source avant de la marquer comme validée.

export const A_VERIFIER: Verification = { statut: 'a-verifier', date: null, par: null };

const LEGIFRANCE_CODE_TRAVAIL =
  'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050/';

export const codeTravail = (article: string): Source => ({
  label: `Code du travail, art. ${article}`,
  url: LEGIFRANCE_CODE_TRAVAIL,
});

export const norme = (ref: string): Source => ({ label: `Norme ${ref}` });

export const SRC = {
  inrsIncendie: {
    label: 'INRS : Incendie et explosion',
    url: 'https://www.inrs.fr/risques/incendie-explosion.html',
  },
  inrsEpi: {
    label: 'INRS : Équipements de protection individuelle',
    url: 'https://www.inrs.fr/demarche/equipements-protection-individuelle.html',
  },
  inrsBruit: { label: 'INRS : Bruit', url: 'https://www.inrs.fr/risques/bruit.html' },
  inrsElectrique: {
    label: 'INRS : Risques électriques',
    url: 'https://www.inrs.fr/risques/electriques.html',
  },
  inrsChimique: {
    label: 'INRS : Risques chimiques',
    url: 'https://www.inrs.fr/risques/chimiques.html',
  },
  inrsChutesHauteur: {
    label: 'INRS : Chutes de hauteur',
    url: 'https://www.inrs.fr/risques/chutes-hauteur.html',
  },
  inrsPlainPied: {
    label: 'INRS : Chutes de plain-pied',
    url: 'https://www.inrs.fr/risques/chutes-plain-pied.html',
  },
  inrsMachines: { label: 'INRS : Machines', url: 'https://www.inrs.fr/risques/machines.html' },
  inrsTms: {
    label: 'INRS : Troubles musculosquelettiques',
    url: 'https://www.inrs.fr/risques/tms-troubles-musculosquelettiques.html',
  },
  inrsActivitePhysique: {
    label: 'INRS : Activité physique et manutention',
    url: 'https://www.inrs.fr/risques/activite-physique.html',
  },
  inrsEcran: {
    label: 'INRS : Travail sur écran',
    url: 'https://www.inrs.fr/risques/travail-ecran.html',
  },
  inrsSignalisation: {
    label: 'INRS : Signalisation de santé et de sécurité',
    url: 'https://www.inrs.fr/demarche/signalisation-sante-securite.html',
  },
  inrsSst: {
    label: 'INRS : Sauvetage secourisme du travail',
    url: 'https://www.inrs.fr/demarche/sauvetage-secourisme-travail.html',
  },
  inrsEvaluation: {
    label: 'INRS : Évaluation des risques professionnels',
    url: 'https://www.inrs.fr/demarche/evaluation-risques-professionnels.html',
  },
  ameliRisquesPro: {
    label: 'Assurance Maladie : Risques professionnels',
    url: 'https://www.ameli.fr/entreprise/sante-travail',
  },
  clp: {
    label: 'Règlement (CE) n° 1272/2008 (CLP)',
    url: 'https://eur-lex.europa.eu/eli/reg/2008/1272/oj',
  },
  reach: {
    label: 'Règlement (CE) n° 1907/2006 (REACH), art. 31',
    url: 'https://eur-lex.europa.eu/eli/reg/2006/1907/oj',
  },
  arreteSignalisation: {
    label:
      'Arrêté du 4 novembre 1993 relatif à la signalisation de sécurité et de santé au travail',
  },
  numerosUrgence: {
    label: 'Service-Public.fr : Numéros d’urgence',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F33954',
  },
  lsrImeca: { label: 'Life Saving Rules IMECA (04/06/2025)' },
  teamUlysse: { label: 'Team Ulysse' },
} satisfies Record<string, Source>;
