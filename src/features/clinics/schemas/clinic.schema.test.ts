import { describe, expect, it } from 'vitest';
import { clinicSchema } from './clinic.schema';

const validBase = {
  nome: 'Clínica Vida',
  cnpj: '',
  telefone: '',
  endereco: '',
};

describe('clinicSchema', () => {
  it('aceita nome preenchido e campos opcionais vazios', () => {
    expect(clinicSchema.safeParse(validBase).success).toBe(true);
  });

  it('aceita CNPJ, telefone e endereço válidos quando preenchidos', () => {
    const result = clinicSchema.safeParse({
      nome: 'Clínica Vida',
      cnpj: '11.444.777/0001-61',
      telefone: '(11) 3456-7890',
      endereco: 'Av. Paulista, 1000',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = clinicSchema.safeParse({ ...validBase, nome: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('nome');
    }
  });

  it('rejeita nome apenas com espaços', () => {
    const result = clinicSchema.safeParse({ ...validBase, nome: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    const result = clinicSchema.safeParse({ ...validBase, nome: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejeita nome com mais de 255 caracteres', () => {
    const result = clinicSchema.safeParse({ ...validBase, nome: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejeita CNPJ inválido quando preenchido', () => {
    const result = clinicSchema.safeParse({ ...validBase, cnpj: '11444777000162' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('cnpj');
    }
  });

  it('rejeita telefone com letras', () => {
    const result = clinicSchema.safeParse({ ...validBase, telefone: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejeita telefone com poucos dígitos', () => {
    const result = clinicSchema.safeParse({ ...validBase, telefone: '(11) 5555' });
    expect(result.success).toBe(false);
  });
});
