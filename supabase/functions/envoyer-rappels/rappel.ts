// Choix du rappel à envoyer selon l'heure de Paris. Fonction pure, testée (tests/rappels.test.ts).

export interface MomentParis {
  annee: number;
  mois: number; // 1 à 12
  jour: number;
  heure: number;
  minute: number;
  /** 0 = dimanche … 6 = samedi */
  jourSemaine: number;
}

export interface Rappel {
  /** Colonne de rappels_abonnes : seuls les abonnés à ce rappel le reçoivent. */
  type: 'pack' | 'avent';
  title: string;
  body: string;
  /** Page ouverte par un appui sur la notification (relative au site). */
  url: string;
  tag: string;
}

const minutes = (m: MomentParis) => m.heure * 60 + m.minute;

/**
 * Case du calendrier : de 7 h 30 à 8 h 29, du 1er au 24 décembre, en semaine.
 * Pack du jour : de 8 h 30 à 9 h 29, en semaine.
 * Les fenêtres d'une heure absorbent le changement d'heure été/hiver de la tâche programmée.
 */
export function choisirRappel(m: MomentParis): Rappel | null {
  if (m.jourSemaine === 0 || m.jourSemaine === 6) return null;
  const t = minutes(m);
  if (t >= 7 * 60 + 30 && t < 8 * 60 + 30) {
    if (m.mois !== 12 || m.jour > 24) return null;
    if (m.jour === 17) {
      return {
        type: 'avent',
        title: '🎬 Jour 17 : scène choc à IMECA',
        body: 'Pas de jeu aujourd’hui : place à une situation réelle. Ouvre la case du jour !',
        url: './#/avent/17',
        tag: `avent-${m.jour}`,
      };
    }
    return {
      type: 'avent',
      title: `🎄 La case du ${m.jour === 1 ? '1er' : m.jour} décembre est ouverte !`,
      body: 'Ton défi sécurité du jour t’attend dans le calendrier de l’Avent.',
      url: `./#/avent/${m.jour}`,
      tag: `avent-${m.jour}`,
    };
  }
  if (t >= 8 * 60 + 30 && t < 9 * 60 + 30) {
    return {
      type: 'pack',
      title: '🃏 Ton pack du jour est disponible !',
      body: '5 nouvelles cartes sécurité t’attendent. Qui aura une légendaire ?',
      url: './#/cartes',
      tag: 'pack',
    };
  }
  return null;
}

/**
 * Faut-il prévenir maintenant la personne tirée au sort pour ce jour de décembre ?
 * En décembre : le jour même (ou après, en rattrapage), jamais en avance.
 * Hors décembre (essais de l'administrateur) : tout de suite.
 */
export function gagnantAPrevenir(jour: number, m: MomentParis): boolean {
  if (m.mois !== 12) return true;
  return jour <= m.jour;
}

/** Notification envoyée à la personne tirée au sort. */
export function messageGagnant(jour: number) {
  return {
    title: '🎁 Tu as été tiré(e) au sort !',
    body: `C’est toi le gagnant du ${jour === 1 ? '1er' : jour} décembre ! Réussis le défi du jour pour remporter ton cadeau.`,
    url: `./#/avent/${jour}`,
    tag: `gagnant-${jour}`,
  };
}

/** Heure de Paris, quelle que soit l'heure du serveur. */
export function momentParis(date: Date): MomentParis {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const jours = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    annee: Number(parts.year),
    mois: Number(parts.month),
    jour: Number(parts.day),
    heure: Number(parts.hour),
    minute: Number(parts.minute),
    jourSemaine: jours.indexOf(parts.weekday),
  };
}
