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
import { choisirRappel, momentParis, type Rappel } from './rappel.ts';

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
  // aux abonnés du pack, pour vérifier l'installation. Sans le bon secret, rien ne se passe.
  const corps = await req.json().catch(() => ({}));
  const cleEssai = Deno.env.get('CLE_ESSAI');
  const essai = Boolean(cleEssai && corps?.essai === cleEssai);

  const rappel = essai ? RAPPEL_ESSAI : choisirRappel(m);
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
