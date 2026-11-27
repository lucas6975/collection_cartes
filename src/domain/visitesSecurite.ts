// Règles d'inscription aux visites sécurité : un membre EP, un salarié et un prestataire /
// intérimaire à chaque visite ; un membre du CODIR au moins une fois toutes les 3 semaines.
import type { RoleVisite, VisiteSecurite } from '../data/api';

export const ROLES: { id: RoleVisite; titre: string; court: string; emoji: string }[] = [
  { id: 'ep', titre: 'Membre EP', court: 'EP', emoji: '🦺' },
  { id: 'salarie', titre: 'Salarié', court: 'Salarié', emoji: '👷' },
  { id: 'prestataire', titre: 'Prestataire / intérimaire', court: 'Prestataire', emoji: '🧰' },
  { id: 'codir', titre: 'Membre du CODIR', court: 'CODIR', emoji: '🎯' },
];

export const ROLES_OBLIGATOIRES: RoleVisite[] = ['ep', 'salarie', 'prestataire'];

const JOUR = 86_400_000;
const t = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Une visite a-t-elle quelqu'un pour ce rôle ? */
export const aRole = (v: VisiteSecurite, r: RoleVisite) => v.inscrits.some((i) => i.role === r);

/**
 * Le CODIR est-il obligatoire à cette visite ? Oui si aucun membre du CODIR n'est inscrit à une
 * visite des 3 semaines précédentes (21 jours) : il faut alors quelqu'un du CODIR ici.
 */
export function codirRequis(visites: VisiteSecurite[], v: VisiteSecurite): boolean {
  const fin = t(v.date);
  return !visites.some(
    (a) => a.id !== v.id && aRole(a, 'codir') && t(a.date) < fin && t(a.date) > fin - 21 * JOUR,
  );
}

/** Rôles manquants (obligatoires, et le CODIR quand il est dû). */
export function rolesManquants(visites: VisiteSecurite[], v: VisiteSecurite): RoleVisite[] {
  const manque = ROLES_OBLIGATOIRES.filter((r) => !aRole(v, r));
  if (!aRole(v, 'codir') && codirRequis(visites, v)) manque.push('codir');
  return manque;
}

/** Date du jour (heure locale) au format AAAA-MM-JJ. */
export function aujourdhui(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** « mardi 6 janvier 2026 ». */
export function dateLongue(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** La visite du jour, sinon la prochaine, sinon la dernière. */
export function visiteParDefaut(visites: VisiteSecurite[], jour = aujourdhui()) {
  return visites.find((v) => v.date >= jour) ?? visites[visites.length - 1] ?? null;
}

/** Liste des zones d'une visite (« 3N/ 4N/ … » découpé). */
export function zonesDe(v: VisiteSecurite): string[] {
  return v.zones.flatMap((z) =>
    z.zones
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
