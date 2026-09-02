import { describe, expect, it } from 'vitest';
import { isCnpjValid } from './cnpj';

describe('isCnpjValid', () => {
  it('aceita CNPJs válidos (com ou sem pontuação)', () => {
    expect(isCnpjValid('11444777000161')).toBe(true);
    expect(isCnpjValid('11.444.777/0001-61')).toBe(true);
    expect(isCnpjValid('11222333000181')).toBe(true);
  });

  it('rejeita tamanho diferente de 14 dígitos', () => {
    expect(isCnpjValid('1144477700016')).toBe(false);
    expect(isCnpjValid('')).toBe(false);
  });

  it('rejeita dígito verificador inválido', () => {
    expect(isCnpjValid('11444777000162')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(isCnpjValid('00000000000000')).toBe(false);
    expect(isCnpjValid('11111111111111')).toBe(false);
  });
});
