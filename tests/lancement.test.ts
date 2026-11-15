import { describe, expect, it } from 'vitest';
import {
  dateInscription,
  inscritsDuJour,
  parHeure,
  parJour,
  plusRecents,
} from '../src/data/lancement';

const maintenant = new Date(2026, 10, 16, 10, 30); // lundi 16 nov. 2026, 10h30
const le = (j: number, h: number, m = 0) => ({
  inscrit_le: new Date(2026, 10, j, h, m).toISOString(),
});

describe('onglet Lancement', () => {
  const liste = [
    le(13, 14, 5),
    le(15, 20),
    le(16, 8, 10),
    le(16, 8, 50),
    le(16, 9, 15),
    le(16, 10, 28),
  ];

  it('compte les inscrits du jour', () => {
    expect(inscritsDuJour(liste, maintenant)).toHaveLength(4);
  });

  it('répartit les inscriptions du jour par heure, de 7h à 18h', () => {
    const h = parHeure(liste, maintenant);
    expect(h[0].label).toBe('7h');
    expect(h.at(-1)!.label).toBe('18h');
    expect(h.find((x) => x.label === '8h')!.n).toBe(2);
    expect(h.find((x) => x.label === '10h')!.actuelle).toBe(true);
    expect(h.reduce((s, x) => s + x.n, 0)).toBe(4);
  });

  it('élargit la plage pour une inscription très tôt', () => {
    expect(parHeure([le(16, 5)], maintenant)[0].label).toBe('5h');
  });

  it('compte les 7 derniers jours', () => {
    const j = parJour(liste, maintenant);
    expect(j).toHaveLength(7);
    expect(j.at(-1)).toMatchObject({ label: 'lun. 16', n: 4, actuelle: true });
    expect(j.find((x) => x.label === 'ven. 13')!.n).toBe(1);
  });

  it('écrit la date d’inscription', () => {
    const iso = (j: number, h: number, m: number) => new Date(2026, 10, j, h, m).toISOString();
    expect(dateInscription(iso(16, 10, 27), maintenant)).toBe('aujourd’hui à 10h27 · il y a 3 min');
    expect(dateInscription(iso(16, 8, 5), maintenant)).toBe('aujourd’hui à 8h05');
    expect(dateInscription(iso(15, 17, 40), maintenant)).toBe('hier à 17h40');
    expect(dateInscription(iso(13, 14, 5), maintenant)).toBe('13 nov. à 14h05');
  });

  it('trie du plus récent au plus ancien', () => {
    expect(plusRecents(liste)[0]).toBe(liste.at(-1));
  });
});
