// Fichier Excel (.xlsx) fabriqué dans le téléphone, sans serveur : plusieurs feuilles,
// en-têtes en gras, vraies dates Excel, largeurs de colonnes.
import { strToU8, zipSync } from 'fflate';

/** Une cellule : texte, nombre, date (Date) ou vide. */
export type Cellule = string | number | Date | null | undefined;

export interface Feuille {
  nom: string;
  lignes: Cellule[][];
  /** Largeur de chaque colonne (en caractères). */
  largeurs?: number[];
}

const echapper = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Caractères de contrôle interdits en XML.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const colonne = (i: number) => {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

/** Numéro de série Excel d'une date (jour seulement). */
const serieExcel = (d: Date) =>
  (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86_400_000;

function xmlFeuille(f: Feuille) {
  const lignes = f.lignes
    .map((ligne, r) => {
      const cellules = ligne
        .map((v, c) => {
          if (v === null || v === undefined || v === '') return '';
          const ref = `${colonne(c)}${r + 1}`;
          const entete = r === 0 ? ' s="1"' : '';
          if (v instanceof Date) return `<c r="${ref}" s="2"><v>${serieExcel(v)}</v></c>`;
          if (typeof v === 'number') return `<c r="${ref}"${entete}><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${entete}><is><t xml:space="preserve">${echapper(v)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${cellules}</row>`;
    })
    .join('');
  const cols = f.largeurs?.length
    ? `<cols>${f.largeurs.map((l, i) => `<col min="${i + 1}" max="${i + 1}" width="${l}" customWidth="1"/>`).join('')}</cols>`
    : '';
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `${cols}<sheetData>${lignes}</sheetData></worksheet>`
  );
}

/** Nom de feuille valide pour Excel (31 caractères, sans : \ / ? * [ ]). */
const nomFeuille = (n: string) => n.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);

export function creerXlsx(feuilles: Feuille[]): Uint8Array {
  const fichiers: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        feuilles
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join('') +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        feuilles
          .map(
            (f, i) =>
              `<sheet name="${echapper(nomFeuille(f.nom))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
          )
          .join('') +
        '</sheets></workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        feuilles
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join('') +
        `<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    ),
    // Styles : 0 normal, 1 en-tête (gras, fond turquoise clair), 2 date jj/mm/aaaa.
    'xl/styles.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFD5EFEC"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
        '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '</styleSheet>',
    ),
  };
  feuilles.forEach((f, i) => {
    fichiers[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(xmlFeuille(f));
  });
  return zipSync(fichiers, { level: 6 });
}

/** Propose le fichier : partage (téléphone) ou téléchargement (ordinateur). */
export async function proposerFichier(donnees: Uint8Array, nom: string) {
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const blob = new Blob([donnees as BlobPart], { type });
  const fichier = new File([blob], nom, { type });
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: nom });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
