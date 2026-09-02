import { describe, expect, it } from 'vitest';
import { extractClinics } from './clinic-list';

describe('extractClinics', () => {
  it('retorna lista vazia quando o resultado é indefinido', () => {
    expect(extractClinics(undefined)).toEqual([]);
  });

  it('retorna lista vazia quando o resultado não tem clínicas', () => {
    expect(extractClinics({ data: { data: { clinics: [] } } })).toEqual([]);
    expect(extractClinics({ data: { data: null } })).toEqual([]);
    expect(extractClinics({ data: null })).toEqual([]);
    expect(extractClinics({})).toEqual([]);
  });

  it('extrai as clínicas do envelope Orval quando presentes', () => {
    const clinics = [{ id: '8712345678901234567', name: 'Clínica Vida', cnpj: '11444777000161' }];
    expect(extractClinics({ data: { data: { clinics } } })).toEqual(clinics);
  });
});
