import { describe, expect, it } from 'vitest';
import { petSchema, patientRegistrationSchema } from './patient.schema';

describe('petSchema', () => {
  it('aceita pet com todos os campos válidos incluindo birthDate', () => {
    const result = petSchema.safeParse({
      species: 'Canino',
      name: 'Rex',
      birthDate: '2022-05-10',
      breed: 'Golden Retriever',
      coatColor: 'Dourado',
    });
    expect(result.success).toBe(true);
  });

  it('aceita pet com idade ao invés de birthDate', () => {
    const result = petSchema.safeParse({
      species: 'Felino',
      name: 'Mimi',
      age: '3 anos',
      breed: 'Siamês',
      coatColor: 'Branco e Cinza',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita pet sem espécie', () => {
    const result = petSchema.safeParse({
      species: '',
      name: 'Rex',
      birthDate: '2022-05-10',
      breed: 'Poodle',
      coatColor: 'Branco',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita pet sem nome', () => {
    const result = petSchema.safeParse({
      species: 'Canino',
      name: '',
      birthDate: '2022-05-10',
      breed: 'Poodle',
      coatColor: 'Branco',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita pet sem raça', () => {
    const result = petSchema.safeParse({
      species: 'Canino',
      name: 'Rex',
      birthDate: '2022-05-10',
      breed: '',
      coatColor: 'Branco',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita pet sem cor da pelagem', () => {
    const result = petSchema.safeParse({
      species: 'Canino',
      name: 'Rex',
      birthDate: '2022-05-10',
      breed: 'Poodle',
      coatColor: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita pet se nem birthDate nem age foram informados', () => {
    const result = petSchema.safeParse({
      species: 'Canino',
      name: 'Rex',
      breed: 'Poodle',
      coatColor: 'Branco',
    });
    expect(result.success).toBe(false);
  });
});

describe('patientRegistrationSchema', () => {
  it('valida tutor e pet juntos', () => {
    const result = patientRegistrationSchema.safeParse({
      client: {
        name: 'Carlos Silva',
        email: 'carlos@example.com',
        cpf: '12345678901',
        phone: '11999998888',
      },
      patient: {
        species: 'Canino',
        name: 'Thor',
        birthDate: '2020-01-01',
        breed: 'Labrador',
        coatColor: 'Preto',
      },
    });
    expect(result.success).toBe(true);
  });
});
