import { describe, expect, it } from 'vitest';
import { onboardingSchema } from './onboarding.schema';

describe('onboardingSchema', () => {
  it('aceita um nome de clínica válido', () => {
    const result = onboardingSchema.safeParse({ name: 'Clínica Visoris Centro' });
    expect(result.success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = onboardingSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('name');
    }
  });

  it('rejeita nome apenas com espaços', () => {
    const result = onboardingSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejeita nome com mais de 255 caracteres', () => {
    const result = onboardingSchema.safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('normaliza espaços nas bordas (trim)', () => {
    const result = onboardingSchema.safeParse({ name: '  Clínica  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Clínica');
    }
  });
});
