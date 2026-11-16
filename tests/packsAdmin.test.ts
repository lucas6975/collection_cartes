import { describe, expect, it } from 'vitest';
import { packsParJour, seriePacks, statutDuJour } from '../src/data/packsAdmin';

const maintenant = new Date(2026, 10, 17, 10, 30); // mardi 17 nov.
const at = (j: number, h: number, m = 0) => new Date(2026, 10, j, h, m).toISOString();
const suivi = (jours: [number, number, number][], vu: string) => ({
  participant_id: 'x',
  packs: jours.map(([j, h, m]) => ({ jour: `2026-11-${j}`, at: at(j, h, m) })),
  cartes: 10,
  vu_le: vu,
});

describe('onglet Packs', () => {
  it('donne l’heure d’ouverture du pack du jour', () => {
    const s = suivi(
      [
        [16, 9, 0],
        [17, 8, 34],
      ],
      at(17, 8, 35),
    );
    expect(statutDuJour(s, maintenant)).toEqual({ type: 'ouvert', heure: '8h34' });
  });

  it('dit « pas encore » seulement si l’appli a été ouverte aujourd’hui', () => {
    expect(statutDuJour(suivi([[16, 9, 0]], at(17, 7, 50)), maintenant).type).toBe('pas-encore');
    expect(statutDuJour(suivi([[16, 9, 0]], at(16, 9, 1)), maintenant).type).toBe('inconnu');
    expect(statutDuJour(undefined, maintenant).type).toBe('inconnu');
  });

  it('compte la série de jours d’affilée', () => {
    expect(
      seriePacks(
        suivi(
          [
            [15, 9, 0],
            [16, 9, 0],
            [17, 9, 0],
          ],
          at(17, 9, 0),
        ),
        maintenant,
      ),
    ).toBe(3);
    expect(
      seriePacks(
        suivi(
          [
            [14, 9, 0],
            [16, 9, 0],
          ],
          at(16, 9, 0),
        ),
        maintenant,
      ),
    ).toBe(1);
  });

  it('compte les packs du jour ouverts sur 7 jours', () => {
    const b = packsParJour(
      [
        suivi(
          [
            [16, 9, 0],
            [17, 8, 0],
          ],
          at(17, 8, 0),
        ),
        suivi([[16, 10, 0]], at(16, 10, 0)),
      ],
      maintenant,
    );
    expect(b).toHaveLength(7);
    expect(b.at(-2)).toMatchObject({ label: 'lun. 16', n: 2 });
    expect(b.at(-1)).toMatchObject({ label: 'mar. 17', n: 1, actuelle: true });
  });
});
