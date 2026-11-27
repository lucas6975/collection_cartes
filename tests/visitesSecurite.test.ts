import { describe, expect, it } from 'vitest';
import type { RoleVisite, VisiteSecurite } from '../src/data/api';
import {
  codirRequis,
  rolesManquants,
  visiteParDefaut,
  zonesDe,
} from '../src/domain/visitesSecurite';

const v = (id: string, date: string, roles: RoleVisite[] = []): VisiteSecurite => ({
  id,
  date,
  horaire: '14h00 à 15h00',
  zones: [
    { pilote: 'X', zones: '1S/0S' },
    { pilote: 'Y', zones: 'Bureaux' },
  ],
  inscrits: roles.map((role, i) => ({ id: `${id}-${i}`, role, nom: `N${i}`, appli: false })),
  ecarts: 0,
  ecarts_a_traiter: 0,
});

describe('visites sécurité', () => {
  it('exige EP, salarié et prestataire à chaque visite', () => {
    const a = v('a', '2026-01-06', ['codir', 'ep']);
    expect(rolesManquants([a], a)).toEqual(['salarie', 'prestataire']);
  });
  it('exige le CODIR si aucun dans les 21 jours précédents', () => {
    const a = v('a', '2026-01-06', ['codir']);
    const b = v('b', '2026-01-14');
    const c = v('c', '2026-01-28');
    const l = [a, b, c];
    expect(codirRequis(l, b)).toBe(false);
    expect(codirRequis(l, c)).toBe(true);
    expect(rolesManquants(l, c)).toContain('codir');
  });
  it('choisit la visite du jour ou la prochaine', () => {
    const l = [v('a', '2026-01-06'), v('b', '2026-01-14')];
    expect(visiteParDefaut(l, '2026-01-07')?.id).toBe('b');
    expect(visiteParDefaut(l, '2026-02-01')?.id).toBe('b');
  });
  it('découpe les zones', () => {
    expect(zonesDe(v('a', '2026-01-06'))).toEqual(['1S', '0S', 'Bureaux']);
  });
});
