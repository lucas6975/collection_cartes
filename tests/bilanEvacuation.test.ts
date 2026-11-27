import { describe, expect, it } from 'vitest';
import type { PresentEvacuation, SuiviEvacuation } from '../src/data/api';
import { bilanEvacuation, dureeLisible } from '../src/domain/bilanEvacuation';

const debut = '2026-11-27T10:00:00Z';
const p = (
  prenom: string,
  nom: string,
  secondes: number,
  extra: Partial<PresentEvacuation> = {},
): PresentEvacuation => ({
  id: prenom,
  prenom,
  nom,
  statut: 'Salarié IMECA',
  societe: null,
  appli: true,
  ajoute_par: 'qr',
  pointe: false,
  heure: new Date(Date.parse(debut) + secondes * 1000).toISOString(),
  ...extra,
});

describe('Bilan d’évacuation', () => {
  it('calcule durées, rythme d’arrivée, moyens et liste d’appel', () => {
    const suivi: SuiviEvacuation = {
      active: null,
      evacuation: {
        id: 'e',
        debut,
        fin: '2026-11-27T10:08:30Z',
        lance_par: 'Lucas',
        effectif_liste: 4,
        test: true,
        liste_appel: ['DUPONT Jean', 'MARTIN Julie', 'LEFEVRE Victor', 'GARCIA Antoine'],
      },
      presents: [
        p('Jean', 'Dupont', 60),
        p('Julie', 'Martin', 120),
        p('Paul', 'Lambert', 200, { statut: 'Visiteur', appli: false }),
        p('Victor', 'Lefèvre', 400, { ajoute_par: 'manuel', appli: false }),
      ],
      historique: [],
    };
    const b = bilanEvacuation(suivi);
    expect(b.duree).toBe(510);
    expect(b.total).toBe(4);
    expect(b.premiere).toBe(60);
    expect(b.t50).toBe(120);
    expect(b.t90).toBe(400);
    expect(b.avant3min).toBe(2);
    expect(b.parMoyen).toEqual({ inscrit: 2, qr: 1, manuel: 1 });
    expect(b.parStatut).toEqual([
      ['Salarié IMECA', 3],
      ['Visiteur', 1],
    ]);
    expect(b.courbe.slice(0, 4)).toEqual([0, 1, 2, 2]);
    expect(b.liste?.ensemble).toBe(3);
    expect(b.liste?.manquants).toEqual(['GARCIA Antoine']);
    expect(b.liste?.horsListe.map((x) => x.nom)).toEqual(['Lambert']);
    expect(b.liste?.taux).toBe(0.75);
  });

  it('affiche les durées lisiblement', () => {
    expect(dureeLisible(52)).toBe('52 s');
    expect(dureeLisible(245)).toBe('4 min 05 s');
    expect(dureeLisible(null)).toBe('—');
  });
});
