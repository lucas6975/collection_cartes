// Lecture d'une photo de liste d'appel dans le téléphone (aucun envoi de la photo) :
// préparation de l'image puis reconnaissance du texte (Tesseract, modèle français léger fourni
// avec l'appli dans public/ocr), et extraction des prénoms et noms.
import { extraireNoms } from '../domain/appel';
import { niveauxDeGris, preparerPourOcr } from '../domain/ocrPretraitement';

const TAILLE_MAX = 2400;

async function photoEnGris(fichier: File) {
  const bmp = await createImageBitmap(fichier);
  const k = Math.min(1, TAILLE_MAX / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return niveauxDeGris(ctx.getImageData(0, 0, w, h).data, w, h);
}

/** Noms lus sur la photo. `progression` reçoit un nombre de 0 à 1. */
export async function lireListeAppel(
  fichier: File,
  progression: (p: number) => void,
): Promise<string[]> {
  progression(0.02);
  const { image } = preparerPourOcr(await photoEnGris(fichier));
  const c = document.createElement('canvas');
  c.width = image.w;
  c.height = image.h;
  const ctx = c.getContext('2d')!;
  const donnees = ctx.createImageData(image.w, image.h);
  for (let i = 0; i < image.px.length; i++) {
    const v = image.px[i];
    donnees.data[i * 4] = v;
    donnees.data[i * 4 + 1] = v;
    donnees.data[i * 4 + 2] = v;
    donnees.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(donnees, 0, 0);
  progression(0.1);

  const { createWorker } = await import('tesseract.js');
  // Moteur et modèle français hébergés avec l'appli (public/ocr) : rien à télécharger ailleurs.
  const dossier = new URL(`${import.meta.env.BASE_URL}ocr`, location.href).href;
  const worker = await createWorker('fra', 1, {
    workerPath: `${dossier}/worker.min.js`,
    corePath: dossier,
    langPath: dossier,
    gzip: true,
    logger: (m) => {
      if (m.status === 'recognizing text') progression(0.1 + m.progress * 0.9);
    },
  });
  try {
    // Mode « un bloc de texte » : une personne par ligne de la liste.
    await worker.setParameters({ tessedit_pageseg_mode: '6' as never });
    const { data } = await worker.recognize(c);
    return extraireNoms(data.text);
  } finally {
    await worker.terminate();
  }
}
