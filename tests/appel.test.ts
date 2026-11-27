import { describe, expect, it } from 'vitest';
import { comparer, extraireNoms, memeNom } from '../src/domain/appel';
import { estimerAngle } from '../src/domain/ocrPretraitement';

describe('Liste d’appel', () => {
  it('lit les noms d’une liste imprimée', () => {
    const texte = `LISTE DES PERSONNES PRÉSENTES SUR SITE
LISTE D'APPEL - POSTE DE GARDE
N° | NOM | PRÉNOM | SOCIÉTÉ | ENTRÉE
1 DUPONT Jean IMECA 07:42
2 MARTIN Julie IMECA 08:01
3 LEFÈVRE Victor ACME 08:15
3 LEFÈVRE Victor ACME 08:15
Total : 3
LL LORS CARS PERE RT TTE NN EI`;
    expect(extraireNoms(texte)).toEqual(['DUPONT JEAN', 'MARTIN JULIE', 'LEFEVRE VICTOR ACME']);
  });

  it('reconnaît la même personne malgré l’ordre, les accents et l’OCR', () => {
    expect(memeNom('DUPONT Jean', 'Jean Dupont')).toBe(true);
    expect(memeNom('LEFEVRE Victor', 'Victor Lefèvre')).toBe(true);
    expect(memeNom('MASMEJAN Vincent', 'Vincent Masméjan')).toBe(true);
    expect(memeNom('DUP0NT Jean', 'Jean Dupont')).toBe(true); // 0 lu au lieu de O
    expect(memeNom('MARTlN Julie', 'Julie Martin')).toBe(true); // l au lieu de I
    expect(memeNom('BERNARD Jean Pierre', 'Jean Bernard')).toBe(true);
    expect(memeNom('MARTIN Jute', 'Julie Martin')).toBe(true);
    expect(memeNom('Visteur ROUSSEAU Carnalle', 'Camille Rousseau')).toBe(true);
    expect(memeNom('INTERIM PLUS NGUYEN TRU LAN', 'Thi Lan Nguyen')).toBe(true);
    expect(memeNom('IMECA B1021 MASMÉJAN Vincent 07:05', 'Vincent Masméjan')).toBe(true);
    expect(memeNom('DUPONT Jean', 'DUPONT Paul')).toBe(false);
    expect(memeNom('DUPONT Jean', 'DURAND Jean')).toBe(false);
    expect(memeNom('MARTIN Julie', 'MARTINEZ Julien')).toBe(false);
  });

  it('compare la liste et les présents', () => {
    const presents = [{ n: 'Jean Dupont' }, { n: 'Julie Martin' }, { n: 'Paul Visiteur' }];
    const r = comparer(['DUPONT Jean', 'MARTIN Julie', 'LEFEVRE Victor'], presents, (p) => p.n);
    expect(r.ensemble.map((e) => e.liste)).toEqual(['DUPONT Jean', 'MARTIN Julie']);
    expect(r.manquants).toEqual(['LEFEVRE Victor']);
    expect(r.horsListe).toEqual([{ n: 'Paul Visiteur' }]);
  });
});

describe('Préparation de la photo', () => {
  it('mesure l’inclinaison d’une liste prise de travers', () => {
    const w = 600;
    const h = 400;
    const px = new Uint8Array(w * h).fill(255);
    // Lignes de « texte » inclinées de 3° (dents de 8 px de haut toutes les 40 px).
    const pente = Math.tan((3 * Math.PI) / 180);
    for (let ligne = 40; ligne < 360; ligne += 40)
      for (let x = 60; x < 540; x++)
        if (x % 12 < 8)
          for (let e = 0; e < 8; e++) {
            const y = Math.round(ligne + e + (x - 300) * pente);
            px[y * w + x] = 0;
          }
    const a = estimerAngle({ px, w, h });
    expect(Math.abs(Math.abs(a) - 3)).toBeLessThanOrEqual(0.25);
  });
});
