import { describe, expect, it } from 'vitest';
import { lireCode, texteQR } from '../src/pages/Echange';

describe('code d’échange', () => {
  it('le QR code est du texte (pas un lien vers le site)', () => {
    expect(texteQR('K7P2QX')).not.toMatch(/https?:/);
    expect(lireCode(texteQR('K7P2QX'))).toBe('K7P2QX');
  });
  it('accepte aussi les anciens liens et le code tapé', () => {
    expect(lireCode('https://x.io/app/#/echange?code=ab12cd')).toBe('AB12CD');
    expect(lireCode(' k7p2qx ')).toBe('K7P2QX');
    expect(lireCode('bonjour')).toBeNull();
  });
});
