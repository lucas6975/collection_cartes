// FICHIER UNIQUE à coller dans Supabase › Edge Functions › envoyer-rappels › index.ts
// (généré par scripts/fonction-tout-en-un.mjs, ne pas modifier à la main)

// Fonction Supabase « envoyer-rappels » : envoie le rappel du moment à tous les abonnés.
//
// Appelée par une tâche programmée (supabase/maj-coalition-et-rappels.sql) à 7 h 30 et 8 h 30 (heure de Paris).
// Elle n'envoie rien en dehors des créneaux prévus et jamais deux fois le même rappel le même
// jour : l'appeler en trop est donc sans effet.
//
// Secrets à définir dans Supabase (Edge Functions › Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// et, pour le mode essai, CLE_ESSAI.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// ───────────── Choix du rappel selon l’heure de Paris ─────────────

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

const RAPPEL_ESSAI: Rappel = {
  type: 'pack',
  title: '✅ Les rappels Team Ulysse fonctionnent !',
  body: 'Ceci est une notification d’essai. Touche-la pour ouvrir l’appli.',
  url: './',
  tag: 'essai',
};

const SITE = 'https://lucas6975.github.io/collection_cartes/';

webpush.setVapidDetails(
  SITE,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const repondre = (corps: unknown) =>
  new Response(JSON.stringify(corps), { headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const m = momentParis(new Date());
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const jour = `${m.annee}-${String(m.mois).padStart(2, '0')}-${String(m.jour).padStart(2, '0')}`;

  // Mode essai : { "essai": "<CLE_ESSAI>" } envoie tout de suite une notification de test
  // (ou un message libre avec « titre » et « texte »)
  // aux abonnés du pack, pour vérifier l'installation. Sans le bon secret, rien ne se passe.
  const corps = await req.json().catch(() => ({}));
  const cleEssai = Deno.env.get('CLE_ESSAI');
  const essai = Boolean(cleEssai && corps?.essai === cleEssai);

  // En mode essai, on peut aussi envoyer un message libre : { "essai": "…", "titre": "…", "texte": "…" }.
  const libre = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
  const titre = libre(corps?.titre, 80);
  const texte = libre(corps?.texte, 240);
  const rappel: Rappel | null = essai
    ? titre || texte
      ? { ...RAPPEL_ESSAI, title: titre ?? RAPPEL_ESSAI.title, body: texte ?? '', tag: 'annonce' }
      : RAPPEL_ESSAI
    : choisirRappel(m);
  if (!rappel) return repondre({ envoyes: 0, raison: 'aucun rappel à cette heure' });

  // Un seul envoi par rappel et par jour (sauf en mode essai).
  if (!essai) {
    const { error: deja } = await db.from('rappels_envois').insert({ type: rappel.type, jour });
    if (deja) return repondre({ envoyes: 0, raison: 'déjà envoyé aujourd’hui' });
  }

  const { data: abonnes, error } = await db
    .from('rappels_abonnes')
    .select('endpoint, p256dh, auth')
    .eq(rappel.type, true);
  if (error) return repondre({ erreur: error.message });

  const message = JSON.stringify({
    title: rappel.title,
    body: rappel.body,
    url: rappel.url,
    tag: rappel.tag,
  });
  let envoyes = 0;
  const expires: string[] = [];
  for (let i = 0; i < (abonnes ?? []).length; i += 50) {
    const lot = abonnes!.slice(i, i + 50);
    const res = await Promise.allSettled(
      lot.map((a) =>
        webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          message,
          { TTL: 4 * 3600, urgency: 'normal' },
        ),
      ),
    );
    res.forEach((r, k) => {
      if (r.status === 'fulfilled') envoyes++;
      else {
        const code = (r.reason as { statusCode?: number })?.statusCode;
        // Téléphone désinscrit ou appli supprimée : on oublie cet abonnement.
        if (code === 404 || code === 410) expires.push(lot[k].endpoint);
      }
    });
  }
  if (expires.length) await db.from('rappels_abonnes').delete().in('endpoint', expires);

  if (!essai)
    await db.from('rappels_envois').update({ envoyes }).match({ type: rappel.type, jour });
  return repondre({ rappel: rappel.type, envoyes, expires: expires.length });
});
