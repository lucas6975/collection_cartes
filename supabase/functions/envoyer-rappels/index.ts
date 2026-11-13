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
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  choisirRappel,
  gagnantAPrevenir,
  messageGagnant,
  momentParis,
  rappelCase,
  rappelCompteARebours,
  type MomentParis,
  type Rappel,
} from './rappel.ts';

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

// L'appli de l'administrateur appelle aussi cette fonction (test des notifications).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const repondre = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

interface Abonne {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Base = SupabaseClient<any, 'public', any>;

/** Envoie un message à des téléphones ; oublie ceux qui n'existent plus. */
async function envoyerA(db: Base, abonnes: Abonne[], message: string) {
  let envoyes = 0;
  const expires: string[] = [];
  for (let i = 0; i < abonnes.length; i += 50) {
    const lot = abonnes.slice(i, i + 50);
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
  return { envoyes, expires: expires.length };
}

/**
 * Prévient les personnes tirées au sort (table notifs_gagnants, remplie à chaque tirage :
 * supabase/maj-gagnant-et-resultats.sql). En décembre, le message part le jour même du tirage
 * (jamais en avance) ; il est envoyé sur tous les téléphones de la personne.
 */
async function prevenirGagnants(db: Base, m: MomentParis) {
  const { data: dus, error } = await db
    .from('notifs_gagnants')
    .select('jour, participant_id')
    .is('envoye_le', null);
  if (error || !dus) return 0;
  let total = 0;
  for (const d of dus as { jour: number; participant_id: string }[]) {
    if (!gagnantAPrevenir(d.jour, m)) continue;
    const { data: abonnes } = await db
      .from('rappels_abonnes')
      .select('endpoint, p256dh, auth')
      .eq('participant_id', d.participant_id);
    const { envoyes } = await envoyerA(
      db,
      (abonnes ?? []) as Abonne[],
      JSON.stringify(messageGagnant(d.jour)),
    );
    total += envoyes;
    // Envoyé, ou journée passée sans téléphone joignable : on n'essaie plus.
    if (envoyes > 0 || (m.mois === 12 && d.jour < m.jour))
      await db
        .from('notifs_gagnants')
        .update({ envoye_le: new Date().toISOString() })
        .eq('jour', d.jour);
  }
  return total;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
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

  // Test de l'administrateur : toutes les notifications du compte à rebours (J-7 à J-1, puis
  // la case du 1er décembre), d'un coup, sur SON téléphone uniquement. Code administrateur exigé.
  if (corps?.test_compte_a_rebours) {
    const { error: refus } = await db.rpc('admin_verifier', { p_code: String(corps.code ?? '') });
    if (refus) return repondre({ erreur: 'Code administrateur incorrect' }, 403);
    const { data: abo } = await db
      .from('rappels_abonnes')
      .select('endpoint, p256dh, auth')
      .eq('endpoint', String(corps.endpoint ?? ''));
    if (!abo?.length)
      return repondre({ erreur: 'Ce téléphone n’est pas inscrit aux rappels' }, 404);
    const liste = [7, 6, 5, 4, 1].map((n) => rappelCompteARebours(n)!);
    liste.push(rappelCase(1));
    let envoyes = 0;
    for (const r of liste) {
      const msg = JSON.stringify({
        title: r.title,
        body: r.body,
        url: r.url,
        tag: `test-${r.tag}`,
      });
      envoyes += (await envoyerA(db, abo as Abonne[], msg)).envoyes;
    }
    return repondre({ test: 'compte à rebours', envoyes });
  }

  // Personnes tirées au sort à prévenir (à chaque appel ; appel dédié juste après un tirage).
  const gagnants = await prevenirGagnants(db, m);
  if (corps?.gagnants) return repondre({ gagnants });

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
  if (!rappel) return repondre({ envoyes: 0, gagnants, raison: 'aucun rappel à cette heure' });

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
  const { envoyes, expires } = await envoyerA(db, (abonnes ?? []) as Abonne[], message);

  if (!essai)
    await db.from('rappels_envois').update({ envoyes }).match({ type: rappel.type, jour });
  return repondre({ rappel: rappel.type, envoyes, expires, gagnants });
});
