import { describe, expect, it } from 'vitest';
import { lireCadeau, texteCadeau } from '../src/pages/AdminCadeau';
import { lireCode } from '../src/pages/Echange';

describe('carte offerte', () => {
  it('lit le code du QR cadeau, sans le confondre avec un échange', () => {
    expect(lireCadeau(texteCadeau('A1B2C3D4E5'))).toBe('A1B2C3D4E5');
    expect(lireCadeau('TEAM ULYSSE ECHANGE ABC123')).toBeNull();
    expect(lireCode(texteCadeau('A1B2C3D4E5'))).toBeNull();
  });
});
