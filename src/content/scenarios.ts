import type { Parcours, Scenario } from '../domain/types';
import { CATEGORIES } from './categories';
import { QUESTIONS } from './questions';
import { A_VERIFIER, SRC, codeTravail } from './sources';

export const SCENARIOS: Scenario[] = [
  {
    id: 's-incendie',
    categorie: 'incendie',
    titre: 'Odeur de brûlé à l’atelier',
    accroche: 'Une odeur suspecte, puis de la fumée. Chaque seconde compte.',
    lieu: 'Atelier de maintenance, 14 h 10',
    nature: 'recommandation',
    sources: [SRC.inrsIncendie, codeTravail('R4227-37 à R4227-39')],
    verification: A_VERIFIER,
    publie: true,
    etapes: [
      {
        id: 'e1',
        situation:
          'Tu remarques une odeur de brûlé dans l’atelier. En t’approchant, tu vois une légère fumée s’échapper d’une armoire électrique. Que fais-tu en premier ?',
        options: [
          {
            id: 'a',
            texte: 'J’ouvre l’armoire pour voir d’où vient le problème',
            correct: false,
            consequence:
              'Ouvrir l’armoire apporte de l’oxygène et t’expose à un risque électrique. Seule une personne habilitée peut intervenir.',
          },
          {
            id: 'b',
            texte: 'Je donne l’alerte selon la consigne du site',
            correct: true,
            consequence:
              'Bon réflexe : alerter tôt permet de mobiliser les bonnes personnes et, si besoin, de déclencher l’évacuation.',
          },
          {
            id: 'c',
            texte: 'Je termine ma tâche, ce n’est sans doute rien',
            correct: false,
            consequence:
              'Un début de feu se développe très vite. Une fumée inhabituelle doit toujours être signalée immédiatement.',
          },
        ],
      },
      {
        id: 'e2',
        situation:
          'Des flammes apparaissent sur le côté de l’armoire. Un extincteur CO2 et un extincteur à eau pulvérisée sans additif sont à proximité. Tu as été formé à leur utilisation.',
        options: [
          {
            id: 'a',
            texte: 'J’utilise l’extincteur à eau',
            correct: false,
            consequence:
              'L’eau sans additif adaptée est conductrice : sur un équipement électrique, risque d’électrisation.',
          },
          {
            id: 'b',
            texte: 'J’utilise l’extincteur CO2, en le tenant par la poignée',
            correct: true,
            consequence:
              'Le CO2 est adapté aux feux d’origine électrique. Tenir la poignée évite les brûlures par le froid au diffuseur.',
          },
          {
            id: 'c',
            texte: 'Je jette un seau d’eau',
            correct: false,
            consequence:
              'Danger : l’eau projetée sur un équipement sous tension expose à l’électrisation.',
          },
        ],
      },
      {
        id: 'e3',
        situation: 'Le feu ne faiblit pas et l’alarme générale retentit. Comment évacues-tu ?',
        options: [
          {
            id: 'a',
            texte: 'Je prends l’ascenseur, c’est plus rapide',
            correct: false,
            consequence:
              'Les ascenseurs peuvent tomber en panne ou mener à un étage enfumé. On emprunte toujours les escaliers.',
          },
          {
            id: 'b',
            texte:
              'Je suis le balisage, je ferme les portes derrière moi et je rejoins le point de rassemblement',
            correct: true,
            consequence:
              'Exactement. Fermer les portes ralentit la propagation des fumées. Au point de rassemblement, tu te signales.',
          },
          {
            id: 'c',
            texte: 'Je retourne chercher mon sac au vestiaire',
            correct: false,
            consequence:
              'On ne revient jamais en arrière pour récupérer des affaires : la situation peut se dégrader en quelques secondes.',
          },
        ],
      },
    ],
  },
  {
    id: 's-epi',
    categorie: 'epi',
    titre: 'Premier jour sur le quai',
    accroche: 'Un nouveau poste, de nouveaux risques. Es-tu bien équipé ?',
    lieu: 'Quai de chargement, 7 h 30',
    nature: 'recommandation',
    sources: [SRC.inrsEpi, codeTravail('R4323-95')],
    verification: A_VERIFIER,
    publie: true,
    etapes: [
      {
        id: 'e1',
        situation:
          'Tu arrives sur le quai de chargement. Des panneaux bleus indiquent le port obligatoire des chaussures de sécurité et du gilet haute visibilité. Tu as oublié tes chaussures.',
        options: [
          {
            id: 'a',
            texte: 'Je travaille en baskets, en faisant attention',
            correct: false,
            consequence:
              'Un colis qui tombe ou une roue de transpalette peut écraser le pied. Le panneau bleu signale une obligation.',
          },
          {
            id: 'b',
            texte: 'Je préviens mon responsable pour obtenir une paire avant de commencer',
            correct: true,
            consequence:
              'Les EPI sont fournis par l’employeur. Mieux vaut quelques minutes de retard qu’un pied écrasé.',
          },
          {
            id: 'c',
            texte: 'J’emprunte une paire trop grande dans un vestiaire',
            correct: false,
            consequence:
              'Des chaussures inadaptées à ta taille protègent mal et augmentent le risque de chute.',
          },
        ],
      },
      {
        id: 'e2',
        situation:
          'Un collègue te propose d’utiliser ses gants de manutention pour transvaser un produit corrosif.',
        options: [
          {
            id: 'a',
            texte: 'J’accepte, des gants restent des gants',
            correct: false,
            consequence:
              'Un gant de manutention ne protège pas contre les produits chimiques. Le produit peut traverser la matière.',
          },
          {
            id: 'b',
            texte: 'Je consulte la FDS du produit pour connaître les gants adaptés',
            correct: true,
            consequence:
              'La fiche de données de sécurité indique les protections adaptées. Le gant doit correspondre au risque.',
          },
          {
            id: 'c',
            texte: 'Je travaille sans gants, mais vite',
            correct: false,
            consequence: 'Un produit corrosif peut causer des lésions graves en quelques secondes.',
          },
        ],
      },
      {
        id: 'e3',
        situation:
          'En fin de journée, tu remarques que la semelle d’une de tes chaussures de sécurité est fendue.',
        options: [
          {
            id: 'a',
            texte: 'Je signale le défaut pour la faire remplacer',
            correct: true,
            consequence:
              'Un EPI endommagé ne garantit plus la protection prévue. Le signaler permet son remplacement.',
          },
          {
            id: 'b',
            texte: 'Je la garde jusqu’à ce qu’elle soit complètement usée',
            correct: false,
            consequence:
              'Une semelle fendue peut laisser passer un objet pointu ou provoquer une glissade.',
          },
          {
            id: 'c',
            texte: 'Je la répare avec de la colle forte',
            correct: false,
            consequence:
              'Une réparation de fortune ne restaure pas les performances certifiées de la chaussure.',
          },
        ],
      },
    ],
  },
  {
    id: 's-risques',
    categorie: 'risques',
    titre: 'La machine bloquée',
    accroche: 'La production attend. La tentation d’aller vite est forte.',
    lieu: 'Ligne de conditionnement, 10 h 45',
    nature: 'recommandation',
    sources: [SRC.inrsMachines],
    verification: A_VERIFIER,
    publie: true,
    etapes: [
      {
        id: 'e1',
        situation:
          'Un carton s’est coincé dans la convoyeuse. Le chef d’équipe est occupé. Que fais-tu ?',
        options: [
          {
            id: 'a',
            texte: 'Je passe la main sous le protecteur pour dégager le carton',
            correct: false,
            consequence:
              'La machine peut redémarrer ou un élément bouger : risque grave d’écrasement ou d’amputation.',
          },
          {
            id: 'b',
            texte: 'J’arrête la machine et j’applique la procédure de consignation prévue',
            correct: true,
            consequence:
              'La consignation (séparer, condamner, vérifier) empêche tout redémarrage pendant l’intervention.',
          },
          {
            id: 'c',
            texte: 'Je démonte le protecteur pour gagner du temps',
            correct: false,
            consequence:
              'On ne neutralise jamais un protecteur : c’est lui qui sépare la main des pièces dangereuses.',
          },
        ],
      },
      {
        id: 'e2',
        situation:
          'Pendant ton intervention, un collègue veut remettre la ligne en marche. Ton cadenas est posé sur le sectionneur.',
        options: [
          {
            id: 'a',
            texte: 'Je lui confie la clé de mon cadenas',
            correct: false,
            consequence:
              'Le cadenas est personnel : toi seul dois pouvoir le retirer une fois en sécurité.',
          },
          {
            id: 'b',
            texte:
              'Je lui explique que je suis dans la machine et que je retirerai mon cadenas à la fin',
            correct: true,
            consequence:
              'C’est le principe de la condamnation : chaque intervenant pose et retire lui-même son cadenas.',
          },
          {
            id: 'c',
            texte: 'Je sors en vitesse pour ne pas le retarder',
            correct: false,
            consequence:
              'Se précipiter fait oublier des outils ou des étapes. La remise en service suit aussi une procédure.',
          },
        ],
      },
    ],
  },
  {
    id: 's-postures',
    categorie: 'postures',
    titre: 'Le déménagement du service',
    accroche: 'Des cartons, des écrans et une journée chargée.',
    lieu: 'Plateau administratif, 9 h 00',
    nature: 'recommandation',
    sources: [SRC.inrsActivitePhysique, SRC.inrsTms, codeTravail('R4541-3')],
    verification: A_VERIFIER,
    publie: true,
    etapes: [
      {
        id: 'e1',
        situation:
          'Ton service déménage. Un carton d’archives très lourd est posé au sol. Un diable est disponible au fond du couloir.',
        options: [
          {
            id: 'a',
            texte: 'Je le soulève d’un coup, dos penché',
            correct: false,
            consequence:
              'Soulever dos penché, charge éloignée du corps, sollicite fortement les disques lombaires.',
          },
          {
            id: 'b',
            texte: 'Je vais chercher le diable',
            correct: true,
            consequence:
              'L’aide mécanique supprime l’essentiel de l’effort. Elle doit être privilégiée dès qu’elle existe.',
          },
          {
            id: 'c',
            texte: 'Je le pousse du pied jusqu’au bureau',
            correct: false,
            consequence:
              'Pousser avec le pied déséquilibre et peut provoquer une chute ou une entorse.',
          },
        ],
      },
      {
        id: 'e2',
        situation:
          'Tu installes ton nouveau poste. L’écran est posé sur une pile de ramettes, nettement au-dessus de tes yeux.',
        options: [
          {
            id: 'a',
            texte: 'Je le garde ainsi, je m’y habituerai',
            correct: false,
            consequence:
              'Lever la tête toute la journée contracte la nuque et les épaules : un facteur de TMS.',
          },
          {
            id: 'b',
            texte:
              'Je règle mon siège puis j’abaisse l’écran à hauteur des yeux, à une longueur de bras',
            correct: true,
            consequence:
              'On règle d’abord le siège, puis l’écran : tête droite, épaules relâchées.',
          },
          {
            id: 'c',
            texte: 'Je rapproche l’écran à 20 cm',
            correct: false,
            consequence:
              'Un écran trop proche fatigue les yeux. La distance recommandée est d’environ une longueur de bras.',
          },
        ],
      },
      {
        id: 'e3',
        situation:
          'Depuis quelques semaines, tu ressens des fourmillements dans le poignet en fin de journée.',
        options: [
          {
            id: 'a',
            texte: 'J’attends que ça passe tout seul',
            correct: false,
            consequence: 'Les TMS s’aggravent souvent s’ils ne sont pas pris en charge tôt.',
          },
          {
            id: 'b',
            texte: 'J’en parle au médecin du travail et à mon responsable',
            correct: true,
            consequence:
              'Signaler tôt permet d’adapter le poste et d’éviter que le trouble ne devienne chronique.',
          },
          {
            id: 'c',
            texte: 'Je prends des antidouleurs pour continuer',
            correct: false,
            consequence: 'Masquer la douleur ne traite pas la cause et peut aggraver la lésion.',
          },
        ],
      },
    ],
  },
  {
    id: 's-organisation',
    categorie: 'organisation',
    titre: 'Chute dans l’escalier',
    accroche: 'Un collègue est au sol. Les bons gestes, dans le bon ordre.',
    lieu: 'Escalier du bâtiment B, 16 h 20',
    nature: 'recommandation',
    sources: [SRC.inrsSst, SRC.numerosUrgence, SRC.inrsPlainPied],
    verification: A_VERIFIER,
    publie: true,
    etapes: [
      {
        id: 'e1',
        situation:
          'Tu trouves un collègue allongé en bas de l’escalier, conscient mais incapable de se relever. Une flaque de liquide se trouve sur les marches.',
        options: [
          {
            id: 'a',
            texte: 'Je l’aide immédiatement à se relever',
            correct: false,
            consequence:
              'Mobiliser une victime peut aggraver une blessure, notamment au dos ou au cou.',
          },
          {
            id: 'b',
            texte: 'Je balise la flaque pour éviter qu’un autre ne chute, sans m’exposer',
            correct: true,
            consequence:
              'Protéger d’abord : éviter le suraccident, pour la victime, pour les autres et pour soi.',
          },
          {
            id: 'c',
            texte: 'Je descends en courant le rejoindre',
            correct: false,
            consequence:
              'Courir sur des marches mouillées, c’est risquer de devenir la deuxième victime.',
          },
        ],
      },
      {
        id: 'e2',
        situation: 'La zone est sécurisée. Qui contactes-tu ?',
        options: [
          {
            id: 'a',
            texte: 'Le SST de l’étage et les secours selon la procédure interne',
            correct: true,
            consequence:
              'Alerter rapidement les bonnes personnes : le SST peut agir en attendant les secours, que l’on appelle selon la consigne du site.',
          },
          {
            id: 'b',
            texte: 'Personne, je vais d’abord voir s’il va mieux dans une heure',
            correct: false,
            consequence:
              'Retarder l’alerte peut avoir des conséquences graves si la blessure est sérieuse.',
          },
          {
            id: 'c',
            texte: 'Je publie un message dans le groupe de l’équipe',
            correct: false,
            consequence:
              'Un message de groupe n’est pas une alerte : rien ne garantit qu’il sera lu à temps.',
          },
        ],
      },
      {
        id: 'e3',
        situation:
          'Le lendemain, tu remarques que la flaque provenait d’une fuite de la fontaine à eau du palier.',
        options: [
          {
            id: 'a',
            texte: 'Je signale la fuite pour qu’elle soit réparée',
            correct: true,
            consequence:
              'Traiter la cause évite qu’un nouvel accident se produise : c’est tout l’intérêt du signalement.',
          },
          {
            id: 'b',
            texte: 'Je n’en parle pas, l’accident a déjà eu lieu',
            correct: false,
            consequence: 'La cause est toujours présente : un autre accident peut se produire.',
          },
          {
            id: 'c',
            texte: 'Je pose une serpillière en permanence',
            correct: false,
            consequence:
              'Une solution de fortune peut elle-même faire trébucher. Il faut traiter la cause.',
          },
        ],
      },
    ],
  },
];

const PARCOURS_TEXTES: Record<string, { titre: string; description: string }> = {
  incendie: {
    titre: 'Les bases de la sécurité incendie',
    description: 'Triangle du feu, classes de feu, extincteurs et évacuation.',
  },
  epi: {
    titre: 'Identifier les équipements de protection',
    description: 'Choisir, porter et entretenir les bons EPI.',
  },
  risques: {
    titre: 'Maîtriser les risques du quotidien',
    description: 'Électricité, produits chimiques, chutes et machines.',
  },
  postures: {
    titre: 'Prévenir les accidents de manutention',
    description: 'Bons gestes, poste de travail et limites de charge.',
  },
  organisation: {
    titre: 'Réagir face à l’imprévu',
    description: 'Signalisation, alerte, premiers secours et droit de retrait.',
  },
};

/** Un parcours par catégorie, composé de toutes les questions de la catégorie. */
export const PARCOURS: Parcours[] = CATEGORIES.map((c) => ({
  id: `p-${c.id}`,
  categorie: c.id,
  ...PARCOURS_TEXTES[c.id],
  questionIds: QUESTIONS.filter((q) => q.categorie === c.id).map((q) => q.id),
  seuil: 0.8,
  publie: true,
}));
