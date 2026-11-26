import { describe, expect, it } from 'vitest';
import {
  blocageDeuxMois,
  clePersonne,
  niveauGlobal,
  niveauQuestion,
  positionBradley,
  scoreEps,
} from '../src/domain/eps';

describe('EPS : formules du fichier Excel', () => {
  it('niveau par question (type × fréquence)', () => {
    expect(niveauQuestion(1, 4)).toBe(1);
    expect(niveauQuestion(2, 1)).toBe(2);
    expect(niveauQuestion(2, 2)).toBe(2);
    expect(niveauQuestion(3, 1)).toBe(2);
    expect(niveauQuestion(2, 3)).toBe(3);
    expect(niveauQuestion(3, 2)).toBe(3);
    expect(niveauQuestion(4, 1)).toBe(3);
    expect(niveauQuestion(4, 2)).toBe(4);
    expect(niveauQuestion(4, 4)).toBe(4);
    expect(niveauQuestion(2, 0)).toBeNull();
    expect(niveauQuestion(0, 0)).toBeNull();
  });

  it('moyenne pondérée et niveau final', () => {
    // Excel : AVERAGE(N*O) sur 4 questions, poids 0,5 / 1,5 / 0,5 / 1,5.
    expect(scoreEps([1, 2, 2, 2])).toBeCloseTo((0.5 + 3 + 1 + 3) / 4);
    expect(scoreEps([4, 4, 4, 4])).toBe(4);
    expect(niveauGlobal(1.99)).toBe(1);
    expect(niveauGlobal(2)).toBe(2);
    expect(niveauGlobal(2.49)).toBe(2);
    expect(niveauGlobal(2.5)).toBe(3);
    expect(niveauGlobal(3.5)).toBe(4);
    expect(scoreEps([null, 2, null, null])).toBe(2);
  });

  it('position sur la courbe : chaque niveau dans son quart', () => {
    expect(positionBradley(1)).toBe(0);
    expect(positionBradley(2)).toBe(0.25);
    expect(positionBradley(2.5)).toBe(0.5);
    expect(positionBradley(4)).toBe(1);
  });
});

describe('EPS : même personne, 2 mois', () => {
  it('clés de noms', () => {
    expect(clePersonne('E.DUPONT')).toBe('E.DUPONT');
    expect(clePersonne('E.DUPONT3')).toBe('E.DUPONT');
    expect(clePersonne('Eric Dupont')).toBe('E.DUPONT');
    expect(clePersonne('DUPONT Eric')).toBe('E.DUPONT');
    expect(clePersonne('JP.MARTIN')).toBe('J.MARTIN');
    expect(clePersonne('A. LE-GALL')).toBe('A.LE-GALL');
    expect(clePersonne('A BERNARD')).toBe('A.BERNARD');
    expect(clePersonne('Victor Lefèvre')).toBe('V.LEFEVRE');
    expect(clePersonne('ZORAN')).toBe('ZORAN');
    expect(clePersonne('LI LAURENT')).toBe('L.LI');
    expect(clePersonne('ROUX JEAN MICHEL')).toBe('J.ROUX');
    expect(clePersonne('JM.PETIT')).toBe('J.PETIT');
    expect(clePersonne('Simon Moreau (S2P)')).toBe('S.MOREAU');
  });

  it('bloque moins de 2 mois après, accepte ensuite', () => {
    const liste = [
      { interviewe: 'E.DUPONT', cle: 'E.DUPONT', interviewer: 'X', date: '2026-09-29' },
    ];
    expect(blocageDeuxMois('E.DUPONT', '2026-11-28', liste)).not.toBeNull();
    expect(blocageDeuxMois('E.DUPONT', '2026-11-29', liste)).toBeNull();
    expect(blocageDeuxMois('B.DUPONT', '2026-10-01', liste)).toBeNull();
    expect(
      blocageDeuxMois('V.ZORAN', '2026-11-20', [
        { interviewe: 'ZORAN', cle: 'ZORAN', interviewer: 'X', date: '2026-11-16' },
      ]),
    ).not.toBeNull();
  });
});
