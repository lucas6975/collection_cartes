// Comparaison de la liste d'appel imprimée (poste de garde) avec les présents déclarés dans l'appli.
// Les noms lus par la caméra (OCR) sont imparfaits : la comparaison tolère les accents, l'ordre
// prénom / NOM, les majuscules et quelques lettres mal lues.

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Mots d'en-tête ou de colonnes à ignorer quand on lit la liste. */
const IGNORES = new Set(
  [
    'nom',
    'noms',
    'prenom',
    'prenoms',
    'societe',
    'entreprise',
    'badge',
    'heure',
    'heures',
    'entree',
    'sortie',
    'date',
    'liste',
    'appel',
    'visiteur',
    'visiteurs',
    'personnel',
    'present',
    'presents',
    'poste',
    'garde',
    'signature',
    'service',
    'total',
    'page',
    'imeca',
    'site',
    'interimaire',
    'prestataire',
    'salarie',
    'mr',
    'mme',
    'm',
    'h',
    'n',
    'no',
    'num',
    'arrivee',
    'emargement',
    'depart',
    'edition',
    'edite',
    'imprime',
    'heure',
    'matricule',
    'telephone',
    'contact',
    'motif',
    'personnes',
    'presentes',
    'present',
    'sur',
    'des',
    'du',
    'de',
    'le',
    'la',
    'les',
  ].map((m) => m.toUpperCase()),
);

/** Mots (lettres seulement, en majuscules sans accent) d'un nom ou d'une ligne lue. */
export function mots(nom: string): string[] {
  const resultat: string[] = [];
  for (const brut of sansAccent(nom)
    .toUpperCase()
    .split(/[\s|;,:/()[\]{}!?"*_=+<>.]+/)) {
    if (!brut) continue;
    const chiffres = (brut.match(/\d/g) ?? []).length;
    const lettres = (brut.match(/[A-Z]/g) ?? []).length;
    // Badge, heure, numéro (« B1021 », « 07:42 ») : on ignore. Un ou deux chiffres lus à la
    // place de lettres dans un vrai mot (« DUP0NT », « MART1N ») : on les corrige.
    if (chiffres && (lettres < 4 || chiffres / (chiffres + lettres) > 0.25)) continue;
    const mot = brut
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/[^A-Z'-]/g, '')
      .split(/'/)
      .map((m) => m.replace(/^-+|-+$/g, ''));
    for (const m of mot) if (m.length >= 2 && !IGNORES.has(m)) resultat.push(m);
  }
  return resultat;
}

/**
 * Lignes lues sur une liste (texte de l'OCR ou collé) : une personne par ligne. On garde tous
 * les mots en lettres de la ligne (la société, le nom et le prénom, dans n'importe quel ordre) ;
 * numéros, badges, heures, en-têtes, lignes parasites et doublons sont retirés.
 */
export function extraireNoms(texte: string): string[] {
  const vus = new Set<string>();
  const noms: string[] = [];
  for (const ligne of texte.split(/\r?\n/)) {
    const m = mots(ligne).slice(0, 8);
    // Au moins deux mots, dont un d'au moins 4 lettres : sinon c'est du bruit de lecture.
    if (m.length < 2 || !m.some((x) => x.length >= 4)) continue;
    // Trop de fragments de 2 lettres (« LL RT NN EI ») : bord de feuille ou tache, pas un nom.
    if (m.filter((x) => x.length <= 2).length * 2 >= m.length) continue;
    const nom = m.join(' ');
    const cle = [...m].sort().join(' ');
    if (vus.has(cle)) continue;
    vus.add(cle);
    noms.push(nom);
  }
  return noms;
}

/** Distance d'édition (lettres à changer pour passer d'un mot à l'autre). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prec = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = t;
    }
  }
  return d[b.length];
}

/** Très proches : 1 lettre d'écart, 2 si les deux mots font 7 lettres ou plus. */
const proches = (a: string, b: string) =>
  a === b || distance(a, b) <= (Math.min(a.length, b.length) >= 7 ? 2 : 1);

/**
 * Assez proches pour un mot mal lu par la caméra : même première lettre, longueur à une lettre
 * près, et au plus ~45 % de lettres différentes (« JUTE » = JULIE, « CARNALLE » = CAMILLE).
 */
const ressemblants = (a: string, b: string) =>
  proches(a, b) ||
  (a[0] === b[0] &&
    Math.abs(a.length - b.length) <= 1 &&
    distance(a, b) <= Math.max(2, Math.floor(Math.max(a.length, b.length) * 0.45)));

/**
 * Même personne ? Chaque mot du nom le plus court doit ressembler à un mot de l'autre (l'ordre,
 * la société sur la même ligne et un 2ᵉ prénom ne comptent pas), et au moins un mot (le nom de
 * famille, en général) doit être très proche.
 */
export function memeNom(a: string, b: string): boolean {
  const ma = mots(a);
  const mb = mots(b);
  if (!ma.length || !mb.length) return false;
  const [court, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma];
  const restants = [...long];
  let solide = false;
  for (const m of court) {
    let i = restants.findIndex((r) => proches(m, r));
    if (i >= 0) solide ||= m.length >= 3;
    else i = restants.findIndex((r) => ressemblants(m, r));
    if (i < 0) return false;
    restants.splice(i, 1);
  }
  return solide;
}

export interface Comparaison<P> {
  /** Sur la liste ET dans l'appli. */
  ensemble: { liste: string; present: P }[];
  /** Sur la liste d'appel, mais pas déclarés présents dans l'appli : à retrouver. */
  manquants: string[];
  /** Déclarés présents dans l'appli, mais pas sur la liste d'appel. */
  horsListe: P[];
}

export function comparer<P>(
  liste: string[],
  presents: P[],
  nomDe: (p: P) => string,
): Comparaison<P> {
  const libres = [...presents];
  const ensemble: { liste: string; present: P }[] = [];
  const manquants: string[] = [];
  for (const nom of liste) {
    const i = libres.findIndex((p) => memeNom(nom, nomDe(p)));
    if (i < 0) manquants.push(nom);
    else ensemble.push({ liste: nom, present: libres.splice(i, 1)[0] });
  }
  return { ensemble, manquants, horsListe: libres };
}
