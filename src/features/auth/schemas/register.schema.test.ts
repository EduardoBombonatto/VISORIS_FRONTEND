import { describe, expect, it } from 'vitest';
import { registerSchema } from './register.schema';

const valid = {
  fullName: 'Dr. João Silva',
  email: 'dr@clinica.com.br',
  password: 'Senha@123',
  documentType: 'CRM',
  professionalDocument: '123456-SP',
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

  it('rejeita documento sem números', () => {
    expect(registerSchema.safeParse({ ...valid, professionalDocument: 'SP' }).success).toBe(false);
  });

  it('rejeita documento sem UF', () => {
    expect(registerSchema.safeParse({ ...valid, professionalDocument: '123456' }).success).toBe(
      false,
    );
  });

  it('rejeita tipo de documento inválido', () => {
    expect(registerSchema.safeParse({ ...valid, documentType: 'CRM-V' }).success).toBe(false);
  });

  it('aceita CRMV como tipo de documento', () => {
    expect(registerSchema.safeParse({ ...valid, documentType: 'CRMV' }).success).toBe(true);
  });

  it('rejeita quando termos não são aceitos', () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
});
