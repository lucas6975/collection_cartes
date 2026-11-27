// Préparation d'une photo de liste d'appel avant la lecture des noms (OCR) : noir et blanc,
// redressement de la photo prise de travers, effacement des traits du tableau (ils empêchent la
// lecture ligne par ligne). Fonctions pures sur des pixels, testées sans navigateur.

export interface Image1 {
  /** Un octet par pixel : 0 = noir, 255 = blanc. */
  px: Uint8Array;
  w: number;
  h: number;
}

/** Niveaux de gris à partir de pixels RGBA (canvas). */
export function niveauxDeGris(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): Image1 {
  const px = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++)
    px[i] = (rgba[i * 4] * 299 + rgba[i * 4 + 1] * 587 + rgba[i * 4 + 2] * 114) / 1000;
  return { px, w, h };
}

/** Seuil d'Otsu : sépare au mieux l'encre du papier. */
export function seuilOtsu(gris: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (const v of gris) hist[v]++;
  const total = gris.length;
  let somme = 0;
  for (let i = 0; i < 256; i++) somme += i * hist[i];
  let sb = 0;
  let wb = 0;
  let meilleur = 0;
  let seuil = 128;
  for (let i = 0; i < 256; i++) {
    wb += hist[i];
    if (!wb) continue;
    const wf = total - wb;
    if (!wf) break;
    sb += i * hist[i];
    const ecart = wb * wf * (sb / wb - (somme - sb) / wf) ** 2;
    if (ecart > meilleur) {
      meilleur = ecart;
      seuil = i;
    }
  }
  return seuil;
}

export function binariser(img: Image1): Image1 {
  const t = seuilOtsu(img.px);
  return { ...img, px: img.px.map((v) => (v <= t ? 0 : 255)) };
}

/**
 * Noir et blanc « adaptatif » (méthode de Bradley) : chaque pixel est comparé à la moyenne de son
 * voisinage, pas à un seuil unique. Une ombre ou un éclairage inégal sur la feuille ne noircit
 * donc plus toute une zone.
 */
export function binariserAdaptatif(img: Image1, sensibilite = 0.15): Image1 {
  const { px, w, h } = img;
  const r = Math.max(8, Math.round(Math.max(w, h) / 48));
  // Image intégrale : somme des pixels au-dessus et à gauche, pour des moyennes en O(1).
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let ligne = 0;
    for (let x = 0; x < w; x++) {
      ligne += px[y * w + x];
      integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + ligne;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const somme =
        integ[y1 * (w + 1) + x1] -
        integ[y0 * (w + 1) + x1] -
        integ[y1 * (w + 1) + x0] +
        integ[y0 * (w + 1) + x0];
      const moyenne = somme / ((x1 - x0) * (y1 - y0));
      out[y * w + x] = px[y * w + x] < moyenne * (1 - sensibilite) ? 0 : 255;
    }
  }
  return { px: out, w, h };
}

/**
 * Angle (en degrés) dont il faut tourner l'image pour que les lignes de texte soient
 * horizontales : celui qui rend le profil des lignes le plus « contrasté ». Calculé sur le centre
 * de la photo (les bords sombres autour de la feuille faussent le calcul).
 */
export function estimerAngle(img: Image1, max = 8, pas = 0.25): number {
  const { px, w, h } = img;
  const points: [number, number][] = [];
  const x0 = Math.floor(w * 0.12);
  const x1 = Math.floor(w * 0.88);
  const y0 = Math.floor(h * 0.12);
  const y1 = Math.floor(h * 0.88);
  const saut = Math.max(1, Math.floor(Math.sqrt((w * h) / 400_000)));
  for (let y = y0; y < y1; y += saut)
    for (let x = x0; x < x1; x += saut) if (px[y * w + x] === 0) points.push([x, y]);
  if (points.length < 50) return 0;
  let meilleur = -1;
  let angle = 0;
  const hist = new Float64Array(h * 2 + w);
  for (let a = -max; a <= max + 1e-9; a += pas) {
    const r = (a * Math.PI) / 180;
    const sin = Math.sin(r);
    const cos = Math.cos(r);
    hist.fill(0);
    for (const [x, y] of points) hist[Math.round(y * cos - x * sin) + w] += 1;
    let s = 0;
    for (const v of hist) s += v * v;
    if (s > meilleur) {
      meilleur = s;
      angle = a;
    }
  }
  return angle;
}

/** Efface les longs traits horizontaux et verticaux (bordures du tableau) et leurs bords. */
export function effacerTraits(img: Image1, marge = 2): Image1 {
  const { px, w, h } = img;
  const out = px.slice();
  const minH = Math.floor(w * 0.1);
  const minV = Math.floor(h * 0.05);
  const blanchir = (x: number, y: number) => {
    if (x >= 0 && x < w && y >= 0 && y < h) out[y * w + x] = 255;
  };
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (px[y * w + x] === 0) {
        const debut = x;
        while (x < w && px[y * w + x] === 0) x++;
        if (x - debut > minH)
          for (let i = debut; i < x; i++) for (let d = -marge; d <= marge; d++) blanchir(i, y + d);
      } else x++;
    }
  }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (px[y * w + x] === 0) {
        const debut = y;
        while (y < h && px[y * w + x] === 0) y++;
        if (y - debut > minV)
          for (let i = debut; i < y; i++) for (let d = -marge; d <= marge; d++) blanchir(x + d, i);
      } else y++;
    }
  }
  return { px: out, w, h };
}

/**
 * Rotation (degrés) et agrandissement en niveaux de gris, avec interpolation bilinéaire :
 * les lettres restent lisses (pas d'escaliers), fond blanc.
 */
export function transformer(img: Image1, degres: number, echelle: number): Image1 {
  const { px, w, h } = img;
  const W = Math.round(w * echelle);
  const H = Math.round(h * echelle);
  const r = (degres * Math.PI) / 180;
  const sin = Math.sin(r);
  const cos = Math.cos(r);
  const cx = w / 2;
  const cy = h / 2;
  const out = new Uint8Array(W * H).fill(255);
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const x = X / echelle - cx;
      const y = Y / echelle - cy;
      const sx = cos * x - sin * y + cx;
      const sy = sin * x + cos * y + cy;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) continue;
      const fx = sx - x0;
      const fy = sy - y0;
      const i = y0 * w + x0;
      out[Y * W + X] =
        px[i] * (1 - fx) * (1 - fy) +
        px[i + 1] * fx * (1 - fy) +
        px[i + w] * (1 - fx) * fy +
        px[i + w + 1] * fx * fy;
    }
  return { px: out, w: W, h: H };
}

/**
 * Chaîne complète, à partir des niveaux de gris : angle mesuré sur une version noir et blanc,
 * photo redressée et agrandie en douceur (bilinéaire), puis noir et blanc, traits du tableau
 * effacés.
 */
export function preparerPourOcr(gris: Image1): { image: Image1; angle: number } {
  const angle = estimerAngle(binariserAdaptatif(gris));
  const echelle = gris.w < 1800 ? Math.min(2, 2400 / gris.w) : 1;
  return {
    image: effacerTraits(binariserAdaptatif(transformer(gris, angle, echelle))),
    angle,
  };
}
