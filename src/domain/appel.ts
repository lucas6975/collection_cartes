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

/** Mots (lettres seulement, en majuscules sans accent) d'un nom. */
export function mots(nom: string): string[] {
  return (
    sansAccent(nom)
      .toUpperCase()
      // Chiffres lus à la place de lettres au milieu d'un mot (« DUP0NT », « MART1N »).
      .replace(/(?<=[A-Z])0|0(?=[A-Z])/g, 'O')
      .replace(/(?<=[A-Z])1|1(?=[A-Z])/g, 'I')
      .replace(/[^A-Z' -]/g, ' ')
      .split(/[\s']+/)
      .map((m) => m.replace(/^-+|-+$/g, ''))
      .filter((m) => m.length >= 2 && !IGNORES.has(m))
  );
}

/**
 * Noms lus sur une liste (texte de l'OCR ou collé) : une personne par ligne, on garde les 2 ou 3
 * premiers mots en lettres (prénom et nom), on enlève numéros, heures, en-têtes et doublons.
 */
export function extraireNoms(texte: string): string[] {
  const vus = new Set<string>();
  const noms: string[] = [];
  for (const ligne of texte.split(/\r?\n/)) {
    const m = mots(ligne);
    if (m.length < 2) continue;
    // Prénom et nom : les 2 premiers mots (la société ou l'heure viennent après).
    const nom = m.slice(0, 2).join(' ');
    const cle = [...mots(nom)].sort().join(' ');
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

/** Deux mots se ressemblent : 1 lettre d’écart, 2 si les deux mots font 7 lettres ou plus. */
const proches = (a: string, b: string) =>
  a === b || distance(a, b) <= (Math.min(a.length, b.length) >= 7 ? 2 : 1);

/**
 * Même personne ? Tous les mots du nom le plus court doivent avoir un mot proche dans l'autre
 * (l'ordre prénom / NOM et un 2ᵉ prénom ne comptent pas). Un prénom réduit à l'initiale
 * (« J. DUPONT ») suffit si le nom de famille correspond.
 */
export function memeNom(a: string, b: string): boolean {
  const ma = mots(a);
  const mb = mots(b);
  if (!ma.length || !mb.length) return false;
  const [court, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma];
  const restants = [...long];
  for (const m of court) {
    const i = restants.findIndex((r) => proches(m, r));
    if (i < 0) return false;
    restants.splice(i, 1);
  }
  return true;
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
