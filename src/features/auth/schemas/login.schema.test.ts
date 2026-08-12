import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = loginSchema.safeParse({
      email: 'dr@clinica.com.br',
      password: 'secret',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita e-mail vazio', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('email');
    }
  });

  it('rejeita e-mail com formato inválido', () => {
    const result = loginSchema.safeParse({
      email: 'nao-e-email',
      password: 'secret',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({
      email: 'dr@clinica.com.br',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('password');
    }
  });
});
