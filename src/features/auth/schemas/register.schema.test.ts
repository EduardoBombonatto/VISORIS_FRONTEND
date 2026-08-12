import { describe, expect, it } from 'vitest';
import { registerSchema } from './register.schema';

const valid = {
  fullName: 'Dr. João Silva',
  email: 'dr@clinica.com.br',
  password: 'Senha@123',
  professionalDocument: 'CRM/SP 123456',
  acceptTerms: true,
};

describe('registerSchema', () => {
  it('aceita dados válidos', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    expect(registerSchema.safeParse({ ...valid, fullName: '' }).success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'Abc@1' }).success).toBe(false);
  });

  it('rejeita senha sem caractere especial', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'Senha123' }).success).toBe(false);
  });

  it('rejeita CRM vazio', () => {
    expect(registerSchema.safeParse({ ...valid, professionalDocument: '' }).success).toBe(false);
  });

  it('rejeita CRM sem números', () => {
    expect(registerSchema.safeParse({ ...valid, professionalDocument: 'CRM/SP' }).success).toBe(
      false,
    );
  });

  it('rejeita CRM sem UF', () => {
    expect(registerSchema.safeParse({ ...valid, professionalDocument: '123456' }).success).toBe(
      false,
    );
  });

  it('rejeita quando termos não são aceitos', () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
});
