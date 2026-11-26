import { unzipSync, strFromU8 } from 'fflate';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { LigneEps } from '../src/data/api';
import { creerXlsx } from '../src/data/excel';
import { feuillesEps, recapEps } from '../src/domain/epsRecap';

const ligne = (p: Partial<LigneEps>): LigneEps => ({
  id: Math.random().toString(),
  interviewe: 'X',
  cle: 'X',
  interviewer: 'Y',
  manager: null,
  correspondant: null,
  service: null,
  secteur: null,
  date: '2026-01-01',
  reponses: null,
  niveaux: null,
  score: null,
  niveau: null,
  source: 'import',
  ...p,
});

const EPS = [
  ligne({
    interviewe: 'E.DUPONT',
    cle: 'E.DUPONT',
    interviewer: 'Gérard Brun',
    manager: 'Brun Gerard',
    date: '2026-02-05',
  }),
  ligne({
    interviewe: 'E.DUPONT',
    cle: 'E.DUPONT',
    interviewer: 'Gerard Brun',
    date: '2026-11-17',
  }),
  ligne({
    interviewe: 'A.MARTIN',
    cle: 'A.MARTIN',
    interviewer: 'Paul Roux',
    manager: 'Gérard Brun',
    date: '2026-11-03',
  }),
  ligne({
    interviewe: 'Jean <Test> & co',
    cle: 'J.TEST',
    interviewer: 'Paul Roux',
    date: '2026-10-01',
    source: 'appli',
    reponses: [1, 2, 3, 4].map((t) => ({
      type: t,
      interaction: 'Aucun',
      frequence: 2,
      resume: 'ok',
    })),
    niveaux: [1, 2, 3, 4],
    score: 2.875,
    niveau: 3,
  }),
];

describe('Récap EPS', () => {
  it('compte par mois, regroupe les noms, repère les doublons et les 2 mois', () => {
    const r = recapEps(EPS, 2026, '2026-11-26');
    expect(r.total).toBe(4);
    expect(r.personnes).toBe(3);
    expect(r.excel).toBe(3);
    expect(r.parMois[10]).toBe(2);
    expect(r.interviewers[0]).toMatchObject({ n: 2 });
    expect(r.managers).toEqual([{ nom: expect.any(String), n: 2 }]);
    expect(r.plusieurs).toEqual([{ nom: 'E.DUPONT', dates: ['2026-02-05', '2026-11-17'] }]);
    expect(r.enAttente.map((x) => x.nom).sort()).toEqual([
      'A.MARTIN',
      'E.DUPONT',
      'Jean <Test> & co',
    ]);
  });

  it('fabrique un vrai fichier xlsx', () => {
    const xlsx = creerXlsx(feuillesEps(EPS, 72, 2026, '2026-11-26'));
    const zip = unzipSync(xlsx);
    expect(Object.keys(zip)).toContain('xl/worksheets/sheet5.xml');
    expect(strFromU8(zip['xl/workbook.xml'])).toContain('Réponses détaillées');
    expect(strFromU8(zip['xl/worksheets/sheet1.xml'])).toContain('Jean &lt;Test&gt; &amp; co');
    if (process.env.EPS_XLSX) writeFileSync(process.env.EPS_XLSX, xlsx);
  });
});
