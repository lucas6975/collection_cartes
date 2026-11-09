import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardSchema } from '../src/types/card';

const dir = join(import.meta.dirname, '../src/data/cards');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

describe('cartes', () => {
  it('au moins une carte existe', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s respecte le schéma et son id correspond au nom du fichier', (file) => {
    const card = CardSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
    expect(card.id).toBe(basename(file, '.json'));
  });
});
