// Rappels sur le téléphone : « pack du jour disponible » et « case du jour à ouvrir ».
//
// Fonctionne avec les notifications du navigateur (Web Push). Sur iPhone, il faut que l'appli
// soit ajoutée à l'écran d'accueil et ouverte depuis son icône (iOS 16.4 ou plus récent).
// L'envoi est fait chaque matin par Supabase (supabase/maj-coalition-et-rappels.sql et supabase/functions).

import { useSyncExternalStore } from 'react';
import { CLE_PUBLIQUE_RAPPELS } from '../config';
import { ApiError, api } from './api';
import { identiteStore } from './identite';

export type Disponibilite =
  /** Le téléphone ne sait pas recevoir de notifications web. */
  | 'impossible'
  /** iPhone : il faut d'abord ajouter l'appli à l'écran d'accueil. */
  | 'ecran-accueil'
  /** Les notifications ont été refusées dans les réglages du téléphone. */
  | 'refusee'
  | 'possible';

export interface Choix {
  pack: boolean;
  avent: boolean;
}

interface Etat extends Choix {
  actifs: boolean;
  /** La personne a répondu « Plus tard » à la proposition. */
  ignore: boolean;
}

const KEY = 'team-ulysse-rappels';
const DEFAUT: Etat = { actifs: false, ignore: false, pack: true, avent: true };

function load(): Etat {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAUT, ...(JSON.parse(raw) as Partial<Etat>) } : DEFAUT;
  } catch {
    return DEFAUT;
  }
}

let etat: Etat = load();
const listeners = new Set<() => void>();

function commit(next: Etat) {
  etat = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(etat));
  } catch {
    // Stockage indisponible : le choix vaut pour la visite.
  }
  listeners.forEach((l) => l());
}

export const estIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const estInstallee = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function disponibilite(): Disponibilite {
  const api = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (estIOS() && !estInstallee()) return 'ecran-accueil';
  if (!api) return 'impossible';
  if (Notification.permission === 'denied') return 'refusee';
  return 'possible';
}

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

async function inscriptionPush(): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL });
  await navigator.serviceWorker.ready;
  const existante = await reg.pushManager.getSubscription();
  if (existante) return existante;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64EnOctets(CLE_PUBLIQUE_RAPPELS),
  });
}

function base64EnOctets(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const brut = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

async function envoyer(sub: PushSubscription, choix: Choix) {
  const json = sub.toJSON();
  await api.rappelsEnregistrer(
    {
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      ...choix,
    },
    identiteStore.get().identite?.jeton,
  );
}

export const rappelsStore = {
  get: () => etat,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  /** Demande l'autorisation au téléphone puis enregistre les rappels choisis. */
  async activer(choix: Choix) {
    if (!choix.pack && !choix.avent) return this.desactiver();
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new ApiError(
        'Les notifications sont bloquées : autorise-les dans les réglages du téléphone.',
      );
    }
    const sub = await inscriptionPush();
    await envoyer(sub, choix);
    commit({ ...etat, ...choix, actifs: true, ignore: false });
  },

  /** Change les rappels choisis (sans redemander l'autorisation). */
  async modifier(choix: Choix) {
    if (!choix.pack && !choix.avent) return this.desactiver();
    const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return this.activer(choix);
    await envoyer(sub, choix);
    commit({ ...etat, ...choix, actifs: true });
  },

  async desactiver() {
    const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await api.rappelsSupprimer(sub.endpoint).catch(() => undefined);
      await sub.unsubscribe().catch(() => undefined);
    }
    commit({ ...etat, actifs: false });
  },

  plusTard() {
    commit({ ...etat, ignore: true });
  },
};

export function useRappels() {
  return useSyncExternalStore(rappelsStore.subscribe, rappelsStore.get);
}
