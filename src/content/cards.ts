import type { Card } from '../domain/types';
import { A_VERIFIER, SRC, codeTravail, norme } from './sources';

type CardInput = Omit<Card, 'verification'>;
const card = (c: CardInput): Card => ({ ...c, verification: A_VERIFIER });

export const CARDS: Card[] = [
  // ───────────── Sécurité incendie ─────────────
  card({
    id: 'triangle-du-feu',
    numero: 1,
    nom: 'Triangle du feu',
    categorie: 'incendie',
    rarete: 'commune',
    icone: 'Triangle',
    description:
      'Un feu ne peut naître que si trois éléments sont réunis : un combustible, un comburant (le plus souvent l’oxygène de l’air) et une source d’énergie (chaleur, étincelle).',
    info: 'Tous les moyens d’extinction agissent en supprimant au moins un des trois côtés du triangle : refroidir, étouffer ou retirer le combustible.',
    leSavaisTu:
      'Un simple court-circuit, une surface chaude ou une étincelle de meulage suffisent à fournir l’énergie d’activation.',
    aRetenir: 'Éloigner les combustibles des sources de chaleur, c’est déjà prévenir l’incendie.',
    nature: 'recommandation',
    sources: [SRC.inrsIncendie],
  }),
  card({
    id: 'alarme-incendie',
    numero: 2,
    nom: 'Alarme incendie',
    categorie: 'incendie',
    rarete: 'commune',
    icone: 'Siren',
    description:
      'Le signal sonore d’alarme générale ordonne l’évacuation. Chacun doit savoir le reconnaître et le distinguer des autres signaux du site.',
    info: 'Les établissements où plus de cinquante personnes peuvent être réunies, ou qui manipulent des matières inflammables, doivent disposer d’un système d’alarme sonore.',
    leSavaisTu:
      'Les exercices d’évacuation servent notamment à apprendre à reconnaître le son de l’alarme générale.',
    aRetenir:
      'Dès que l’alarme retentit, on évacue : on n’attend pas de savoir si c’est un exercice.',
    nature: 'obligation',
    sources: [codeTravail('R4227-34'), SRC.inrsIncendie],
  }),
  card({
    id: 'classes-de-feu',
    numero: 3,
    nom: 'Classes de feu',
    categorie: 'incendie',
    rarete: 'peu-commune',
    icone: 'Layers',
    description:
      'Les feux sont classés selon la nature du combustible : A (solides), B (liquides ou solides liquéfiables), C (gaz), D (métaux) et F (huiles et graisses de cuisson).',
    info: 'La classe de feu indiquée sur un extincteur précise sur quels feux il est efficace. Un extincteur inadapté peut être inefficace, voire aggraver la situation.',
    leSavaisTu:
      'Il n’existe plus de « classe E » pour les feux d’origine électrique : on vérifie sur l’extincteur la mention d’utilisation sur les équipements sous tension.',
    aRetenir:
      'Avant d’utiliser un extincteur, lire son étiquette : classes de feu et usage électrique.',
    nature: 'norme',
    sources: [norme('NF EN 2 (classification des feux)'), SRC.inrsIncendie],
  }),
  card({
    id: 'extincteur-co2',
    numero: 4,
    nom: 'Extincteur CO2',
    categorie: 'incendie',
    rarete: 'rare',
    icone: 'FireExtinguisher',
    description:
      'L’extincteur au dioxyde de carbone est adapté aux feux d’origine électrique et à certains feux de liquides inflammables. Il étouffe le feu sans laisser de résidu.',
    info: 'Le CO2 sort très froid : le diffuseur peut provoquer des brûlures par le froid. Dans un local exigu, le gaz chasse l’oxygène : il faut aérer après usage.',
    leSavaisTu:
      'Le CO2 est peu efficace sur les feux de solides qui forment des braises (bois, papier) : le feu peut reprendre une fois le gaz dissipé.',
    aRetenir:
      'Tenir l’extincteur CO2 par la poignée, jamais par le diffuseur, et ne pas l’utiliser sur une personne.',
    nature: 'recommandation',
    sources: [SRC.inrsIncendie],
  }),
  card({
    id: 'evacuation',
    numero: 5,
    nom: 'Procédure d’évacuation',
    categorie: 'incendie',
    rarete: 'epique',
    icone: 'DoorOpen',
    description:
      'Une consigne de sécurité incendie, affichée dans l’établissement, précise l’organisation de l’évacuation. Des exercices ont lieu au moins tous les six mois.',
    info: 'On suit le balisage vers la sortie, on n’utilise pas les ascenseurs, on referme les portes derrière soi sans les verrouiller et on rejoint le point de rassemblement.',
    leSavaisTu:
      'En présence de fumée, l’air respirable se trouve près du sol : on se baisse pour progresser.',
    aRetenir:
      'Au point de rassemblement, on se signale et on ne retourne jamais chercher un objet.',
    nature: 'obligation',
    sources: [codeTravail('R4227-37 à R4227-39'), SRC.inrsIncendie],
  }),
  card({
    id: 'serre-file',
    numero: 6,
    nom: 'Guide-file et serre-file',
    categorie: 'incendie',
    rarete: 'legendaire',
    icone: 'Flag',
    description:
      'Le guide-file ouvre la marche vers la sortie. Le serre-file ferme la marche et vérifie que personne ne reste dans la zone : bureaux, sanitaires, salles de réunion.',
    info: 'Ces rôles sont désignés par l’entreprise dans son organisation de l’évacuation. Ils rendent compte au responsable de l’évacuation au point de rassemblement.',
    leSavaisTu:
      'Le serre-file referme les portes derrière lui pour ralentir la propagation des fumées.',
    aRetenir: 'Connaître les guide-files et serre-files de sa zone, et suivre leurs consignes.',
    nature: 'recommandation',
    sources: [SRC.inrsIncendie],
  }),

  // ───────────── EPI ─────────────
  card({
    id: 'casque',
    numero: 7,
    nom: 'Casque de protection',
    categorie: 'epi',
    rarete: 'commune',
    icone: 'HardHat',
    description:
      'Le casque protège la tête contre les chutes d’objets et les chocs. Il est obligatoire dans les zones où ce risque est signalé.',
    info: 'Un casque a une durée d’utilisation fixée par le fabricant. Il doit être remplacé après un choc important, même sans dommage visible.',
    leSavaisTu:
      'Le harnais intérieur, qui laisse un espace entre la coque et la tête, absorbe une grande partie de l’énergie du choc.',
    aRetenir:
      'Un casque se règle à sa tête, se porte jugulaire attachée si nécessaire et se remplace après un choc.',
    nature: 'norme',
    sources: [norme('EN 397 (casques de protection pour l’industrie)'), SRC.inrsEpi],
  }),
  card({
    id: 'lunettes',
    numero: 8,
    nom: 'Lunettes de protection',
    categorie: 'epi',
    rarete: 'commune',
    icone: 'Glasses',
    description:
      'Lunettes, lunettes-masques ou écrans faciaux protègent les yeux des projections, poussières, produits chimiques et rayonnements.',
    info: 'Le modèle dépend du risque : lunettes à branches pour les projections légères, lunettes-masques contre les liquides, filtres spécifiques pour le soudage.',
    leSavaisTu:
      'Des lunettes de vue ne sont pas des lunettes de protection : il existe des surlunettes et des modèles correcteurs certifiés.',
    aRetenir: 'Choisir la protection oculaire selon le risque, pas selon le confort.',
    nature: 'norme',
    sources: [norme('EN 166 (protection individuelle de l’œil)'), SRC.inrsEpi],
  }),
  card({
    id: 'protection-auditive',
    numero: 9,
    nom: 'Protection auditive',
    categorie: 'epi',
    rarete: 'peu-commune',
    icone: 'Ear',
    description:
      'Bouchons et casques antibruit réduisent l’exposition sonore. À partir de 80 dB(A) sur 8 heures, l’employeur met des protecteurs à disposition ; à partir de 85 dB(A), il veille à ce qu’ils soient portés.',
    info: 'La valeur limite d’exposition est de 87 dB(A), en tenant compte de l’atténuation apportée par les protecteurs.',
    leSavaisTu: 'La perte d’audition due au bruit est irréversible et s’installe sans douleur.',
    aRetenir:
      'Dans une zone bruyante, on porte ses protections en permanence : les retirer quelques minutes suffit à réduire fortement leur efficacité.',
    nature: 'obligation',
    sources: [codeTravail('R4431-2 et R4434-7'), SRC.inrsBruit],
  }),
  card({
    id: 'gants',
    numero: 10,
    nom: 'Gants adaptés',
    categorie: 'epi',
    rarete: 'rare',
    icone: 'Hand',
    description:
      'Il n’existe pas de gant universel : risques mécaniques (coupures, abrasion), chimiques et thermiques demandent chacun des gants spécifiques.',
    info: 'Les pictogrammes et codes inscrits sur le gant indiquent ses performances. Un gant de manutention ne protège pas d’un produit chimique.',
    leSavaisTu:
      'Près d’une machine avec des pièces en rotation, porter des gants peut augmenter le risque d’entraînement de la main.',
    aRetenir: 'Vérifier que le gant correspond au risque et l’inspecter avant chaque utilisation.',
    nature: 'norme',
    sources: [norme('EN 388 (risques mécaniques), EN ISO 374 (risques chimiques)'), SRC.inrsEpi],
  }),
  card({
    id: 'chaussures',
    numero: 11,
    nom: 'Chaussures de sécurité',
    categorie: 'epi',
    rarete: 'epique',
    icone: 'Footprints',
    description:
      'Les chaussures de sécurité possèdent un embout protégeant les orteils contre l’écrasement. Selon leur classe, elles offrent aussi une semelle antiperforation ou une résistance à l’eau.',
    info: 'Le marquage (SB, S1, S2, S3…) indique les protections présentes. On choisit la classe selon les risques du poste.',
    leSavaisTu:
      'L’embout d’une chaussure de sécurité est testé pour résister à un choc de 200 joules.',
    aRetenir:
      'Des chaussures de sécurité abîmées ou déformées ne protègent plus : on les remplace.',
    nature: 'norme',
    sources: [norme('EN ISO 20345 (chaussures de sécurité)'), SRC.inrsEpi],
  }),
  card({
    id: 'protection-collective',
    numero: 12,
    nom: 'Protection collective d’abord',
    categorie: 'epi',
    rarete: 'legendaire',
    icone: 'ShieldCheck',
    description:
      'Parmi les principes généraux de prévention, l’employeur doit donner la priorité aux mesures de protection collective sur les mesures de protection individuelle.',
    info: 'L’EPI intervient quand le risque ne peut pas être évité ou suffisamment limité autrement. Il est fourni gratuitement par l’employeur.',
    leSavaisTu:
      'Le Code du travail énumère neuf principes généraux de prévention, du plus efficace (éviter le risque) au moins efficace.',
    aRetenir:
      'L’EPI est le dernier rempart : il complète les protections collectives, il ne les remplace pas.',
    nature: 'obligation',
    sources: [codeTravail('L4121-2 et R4323-95'), SRC.inrsEpi],
  }),

  // ───────────── Prévention des risques ─────────────
  card({
    id: 'risque-electrique',
    numero: 13,
    nom: 'Risque électrique',
    categorie: 'risques',
    rarete: 'commune',
    icone: 'Zap',
    description:
      'Le courant électrique peut provoquer électrisation, électrocution, brûlures et incendies. Les opérations sur les installations électriques sont réservées aux personnes habilitées.',
    info: 'L’habilitation électrique est délivrée par l’employeur après une formation. Elle précise ce que la personne est autorisée à faire.',
    leSavaisTu:
      'Un équipement hors tension n’est pas forcément sans danger : certains éléments, comme les condensateurs, peuvent rester chargés.',
    aRetenir:
      'Sans habilitation, on n’ouvre pas une armoire électrique et on ne répare pas un câble : on signale.',
    nature: 'obligation',
    sources: [codeTravail('R4544-9'), norme('NF C 18-510'), SRC.inrsElectrique],
  }),
  card({
    id: 'pictogrammes-chimiques',
    numero: 14,
    nom: 'Pictogrammes de danger',
    categorie: 'risques',
    rarete: 'commune',
    icone: 'FlaskConical',
    description:
      'Les produits chimiques dangereux portent des pictogrammes en forme de losange blanc bordé de rouge : inflammable, toxique, corrosif, dangereux pour la santé, etc.',
    info: 'L’étiquette indique aussi une mention d’avertissement (« Danger » ou « Attention ») et des conseils de prudence.',
    leSavaisTu: 'Le règlement européen CLP définit neuf pictogrammes de danger.',
    aRetenir:
      'On lit l’étiquette avant d’utiliser un produit, et on ne le transvase jamais dans un contenant alimentaire.',
    nature: 'obligation',
    sources: [SRC.clp, SRC.inrsChimique],
  }),
  card({
    id: 'fds',
    numero: 15,
    nom: 'Fiche de données de sécurité',
    categorie: 'risques',
    rarete: 'peu-commune',
    icone: 'FileText',
    description:
      'La fiche de données de sécurité (FDS) accompagne les produits chimiques dangereux. Elle décrit leurs dangers, les précautions d’emploi et la conduite à tenir en cas d’accident.',
    info: 'Le fournisseur doit la transmettre. Elle comporte 16 rubriques normalisées, dont les premiers secours, la lutte contre l’incendie et les EPI recommandés.',
    leSavaisTu:
      'La rubrique 8 de la FDS précise les équipements de protection individuelle adaptés au produit.',
    aRetenir: 'Savoir où sont rangées les FDS des produits utilisés dans son service.',
    nature: 'obligation',
    sources: [SRC.reach, SRC.inrsChimique],
  }),
  card({
    id: 'chute-hauteur',
    numero: 16,
    nom: 'Chute de hauteur',
    categorie: 'risques',
    rarete: 'rare',
    icone: 'ArrowDownToLine',
    description:
      'Les chutes de hauteur figurent parmi les principales causes d’accidents graves au travail. Elles peuvent survenir même à faible hauteur.',
    info: 'La protection collective (garde-corps, plateforme) est prioritaire. L’échelle n’est pas un poste de travail, sauf impossibilité technique ou travaux de courte durée à faible risque.',
    leSavaisTu:
      'Un escabeau ou une chaise utilisés pour atteindre une étagère sont à l’origine de nombreuses chutes en bureau.',
    aRetenir:
      'Pour travailler en hauteur, on utilise un équipement adapté (plateforme individuelle roulante), jamais une chaise.',
    nature: 'obligation',
    sources: [codeTravail('R4323-63'), SRC.inrsChutesHauteur],
  }),
  card({
    id: 'consignation',
    numero: 17,
    nom: 'Consignation des machines',
    categorie: 'risques',
    rarete: 'epique',
    icone: 'Lock',
    description:
      'Avant une intervention (maintenance, nettoyage, déblocage), une machine est mise en sécurité : séparation des énergies, condamnation, vérification de l’absence d’énergie.',
    info: 'La condamnation (cadenas personnel, étiquette) empêche une remise en marche pendant que quelqu’un intervient.',
    leSavaisTu:
      'Couper une machine par son bouton d’arrêt ne suffit pas : de l’énergie peut subsister (pression, ressort, inertie).',
    aRetenir: 'On ne neutralise jamais un protecteur ou un dispositif de sécurité d’une machine.',
    nature: 'recommandation',
    sources: [SRC.inrsMachines],
  }),
  card({
    id: 'duerp',
    numero: 18,
    nom: 'Document unique (DUERP)',
    categorie: 'risques',
    rarete: 'legendaire',
    icone: 'BookMarked',
    description:
      'L’employeur évalue les risques professionnels et transcrit les résultats dans le document unique d’évaluation des risques professionnels (DUERP).',
    info: 'Dans les entreprises d’au moins 11 salariés, le document unique est mis à jour au moins chaque année, ainsi qu’à chaque changement important.',
    leSavaisTu: 'Le DUERP doit être tenu à la disposition des travailleurs.',
    aRetenir: 'Signaler un risque nouveau permet de mettre à jour l’évaluation des risques.',
    nature: 'obligation',
    sources: [codeTravail('R4121-1 et R4121-2'), SRC.inrsEvaluation],
  }),

  // ───────────── Gestes et postures ─────────────
  card({
    id: 'poste-ecran',
    numero: 19,
    nom: 'Poste de travail sur écran',
    categorie: 'postures',
    rarete: 'commune',
    icone: 'Monitor',
    description:
      'Un poste bien réglé limite la fatigue visuelle et les douleurs : haut de l’écran à hauteur des yeux ou légèrement en dessous, écran à environ une longueur de bras.',
    info: 'On place l’écran perpendiculairement aux fenêtres pour éviter les reflets et l’éblouissement. Les pieds reposent à plat, les avant-bras sont soutenus.',
    leSavaisTu:
      'Avec deux écrans utilisés autant l’un que l’autre, on les place côte à côte, centrés face à soi.',
    aRetenir: 'Régler son siège d’abord, puis la hauteur et la distance de l’écran.',
    nature: 'recommandation',
    sources: [SRC.inrsEcran],
  }),
  card({
    id: 'varier-postures',
    numero: 20,
    nom: 'Varier ses postures',
    categorie: 'postures',
    rarete: 'commune',
    icone: 'Repeat',
    description:
      'Rester longtemps dans la même position sollicite toujours les mêmes muscles. Alterner les postures et faire de courtes pauses réduit les contraintes.',
    info: 'Se lever, marcher, changer de tâche : de petites variations régulières sont plus efficaces qu’une longue pause unique.',
    leSavaisTu: 'En ergonomie, on dit souvent que la meilleure posture est… la suivante.',
    aRetenir: 'Bouger régulièrement fait partie du travail bien fait.',
    nature: 'recommandation',
    sources: [SRC.inrsTms],
  }),
  card({
    id: 'gestes-port-charge',
    numero: 21,
    nom: 'Porter une charge',
    categorie: 'postures',
    rarete: 'peu-commune',
    icone: 'Package',
    description:
      'Pour soulever une charge : se rapprocher, fléchir les jambes, garder le dos droit, tenir la charge près du corps et éviter de tourner le tronc.',
    info: 'Avant de porter, on évalue la charge (poids, prise, stabilité) et le trajet. Pour changer de direction, on pivote avec les pieds.',
    leSavaisTu:
      'Plus la charge est éloignée du corps, plus l’effort supporté par le bas du dos augmente.',
    aRetenir:
      'Si la charge est trop lourde ou encombrante, on demande de l’aide ou une aide mécanique.',
    nature: 'recommandation',
    sources: [SRC.inrsActivitePhysique],
  }),
  card({
    id: 'limites-charge',
    numero: 22,
    nom: 'Limites de charge',
    categorie: 'postures',
    rarete: 'rare',
    icone: 'Weight',
    description:
      'Un homme ne peut être amené à porter de façon habituelle des charges de plus de 55 kg que s’il a été reconnu apte par le médecin du travail, et jamais plus de 105 kg.',
    info: 'Pour les femmes, le port de charges de plus de 25 kg est interdit (40 kg avec une brouette). Ces limites sont des maximums, pas des objectifs.',
    leSavaisTu:
      'Des valeurs bien plus basses sont recommandées en prévention, car les TMS surviennent bien en dessous de ces limites.',
    aRetenir:
      'Les limites légales ne garantissent pas l’absence de risque : on réduit le port de charges au maximum.',
    nature: 'obligation',
    sources: [codeTravail('R4541-9 et D4152-12'), SRC.inrsActivitePhysique],
  }),
  card({
    id: 'tms',
    numero: 23,
    nom: 'Troubles musculosquelettiques',
    categorie: 'postures',
    rarete: 'epique',
    icone: 'Activity',
    description:
      'Les TMS touchent muscles, tendons et nerfs (dos, épaules, poignets…). Ils constituent la première cause de maladies professionnelles reconnues en France.',
    info: 'Ils résultent de la combinaison de gestes répétitifs, d’efforts, de postures contraignantes, mais aussi du stress et de l’organisation du travail.',
    leSavaisTu:
      'Douleurs, fourmillements ou raideurs qui reviennent sont des signaux d’alerte à signaler tôt.',
    aRetenir: 'En cas de douleurs persistantes, on en parle au médecin du travail sans attendre.',
    nature: 'recommandation',
    sources: [SRC.inrsTms, SRC.ameliRisquesPro],
  }),
  card({
    id: 'manutention-assistee',
    numero: 24,
    nom: 'Manutention assistée',
    categorie: 'postures',
    rarete: 'legendaire',
    icone: 'Forklift',
    description:
      'L’employeur organise le travail et fournit des équipements, notamment mécaniques, pour éviter le recours à la manutention manuelle.',
    info: 'Diable, transpalette, chariot, table élévatrice : ces aides réduisent l’effort, à condition d’être formé à leur utilisation.',
    leSavaisTu:
      'La conduite d’un chariot automoteur nécessite une autorisation de conduite délivrée par l’employeur.',
    aRetenir: 'Une aide mécanique disponible, c’est une aide à utiliser.',
    nature: 'obligation',
    sources: [codeTravail('R4541-3'), SRC.inrsActivitePhysique],
  }),

  // ───────────── Organisation et procédures ─────────────
  card({
    id: 'couleurs-signalisation',
    numero: 25,
    nom: 'Couleurs de signalisation',
    categorie: 'organisation',
    rarete: 'commune',
    icone: 'Signpost',
    description:
      'Rouge : interdiction et matériel incendie. Jaune : avertissement d’un danger. Bleu : obligation. Vert : sauvetage et premiers secours.',
    info: 'La forme compte aussi : cercle pour l’interdiction et l’obligation, triangle pour l’avertissement, carré ou rectangle pour l’information.',
    leSavaisTu:
      'Les pictogrammes de sécurité sont harmonisés au niveau international par la norme ISO 7010.',
    aRetenir: 'Un panneau bleu rond signifie une obligation : par exemple, porter un casque.',
    nature: 'obligation',
    sources: [SRC.arreteSignalisation, norme('ISO 7010'), SRC.inrsSignalisation],
  }),
  card({
    id: 'numeros-urgence',
    numero: 26,
    nom: 'Numéros d’urgence',
    categorie: 'organisation',
    rarete: 'commune',
    icone: 'PhoneCall',
    description:
      '15 : SAMU. 18 : sapeurs-pompiers. 112 : numéro d’urgence européen. 114 : numéro d’urgence pour les personnes sourdes ou malentendantes (SMS, visio).',
    info: 'Lors de l’appel, on précise : le lieu exact, la nature de l’accident, le nombre de victimes et leur état. On ne raccroche que lorsque l’opérateur l’indique.',
    leSavaisTu: 'Le 112 fonctionne dans tous les pays de l’Union européenne.',
    aRetenir:
      'Connaître aussi le numéro d’urgence interne de son site et la procédure d’accueil des secours.',
    nature: 'recommandation',
    sources: [SRC.numerosUrgence],
  }),
  card({
    id: 'proteger-alerter-secourir',
    numero: 27,
    nom: 'Protéger, alerter, secourir',
    categorie: 'organisation',
    rarete: 'peu-commune',
    icone: 'HeartPulse',
    description:
      'Face à un accident : protéger pour éviter un suraccident, alerter les secours, puis secourir la victime dans la limite de ses compétences.',
    info: 'Protéger, c’est supprimer le danger ou isoler la zone, sans se mettre soi-même en danger.',
    leSavaisTu:
      'Cette démarche est au cœur de la formation de sauveteur secouriste du travail (SST).',
    aRetenir: 'On ne déplace pas une victime, sauf danger immédiat et impossible à supprimer.',
    nature: 'recommandation',
    sources: [SRC.inrsSst],
  }),
  card({
    id: 'droit-alerte-retrait',
    numero: 28,
    nom: 'Droit d’alerte et de retrait',
    categorie: 'organisation',
    rarete: 'rare',
    icone: 'Megaphone',
    description:
      'Un travailleur alerte immédiatement l’employeur de toute situation dont il a un motif raisonnable de penser qu’elle présente un danger grave et imminent. Il peut se retirer de cette situation.',
    info: 'Le retrait ne doit pas créer une nouvelle situation de danger grave et imminent pour d’autres personnes.',
    leSavaisTu:
      'Aucune sanction ni retenue de salaire ne peut être prise contre un travailleur qui s’est retiré d’une situation dont il avait un motif raisonnable de penser qu’elle présentait un danger grave et imminent.',
    aRetenir: 'Face à un danger grave et imminent : alerter d’abord, se retirer si nécessaire.',
    nature: 'obligation',
    sources: [codeTravail('L4131-1 et L4131-3')],
  }),
  card({
    id: 'circulation',
    numero: 29,
    nom: 'Circulation dans les locaux',
    categorie: 'organisation',
    rarete: 'epique',
    icone: 'Route',
    description:
      'Les chutes de plain-pied et les collisions avec des engins sont des accidents fréquents. Allées balisées, sols dégagés et séparation piétons/engins les préviennent.',
    info: 'On emprunte les cheminements piétons, on tient la rampe dans les escaliers et on ne court pas, même pressé.',
    leSavaisTu:
      'Les chutes de plain-pied (glissades, trébuchements) sont l’une des premières causes d’accidents du travail.',
    aRetenir: 'Un câble qui traîne ou un sol glissant se signale et se traite tout de suite.',
    nature: 'recommandation',
    sources: [SRC.inrsPlainPied],
  }),
  card({
    id: 'sst',
    numero: 30,
    nom: 'Sauveteur secouriste du travail',
    categorie: 'organisation',
    rarete: 'legendaire',
    icone: 'Cross',
    description:
      'Dans chaque atelier où sont effectués des travaux dangereux, un membre du personnel doit avoir reçu la formation de secourisme nécessaire pour donner les premiers secours en cas d’urgence.',
    info: 'Le SST sait protéger, examiner la victime, faire alerter et secourir. Il contribue aussi à la prévention dans l’entreprise.',
    leSavaisTu:
      'Le certificat SST doit être actualisé régulièrement par un maintien et actualisation des compétences (MAC).',
    aRetenir:
      'Connaître les SST de son équipe et l’emplacement de la trousse de secours et du défibrillateur.',
    nature: 'obligation',
    sources: [codeTravail('R4224-15'), SRC.inrsSst],
  }),
];
