import { describe, expect, it } from 'vitest';
import { serverFieldToFormField, toCreateClinicRequest } from './clinic-mappers';

describe('toCreateClinicRequest', () => {
  it('mapeia campos do formulário para o DTO', () => {
    expect(
      toCreateClinicRequest({
        nome: 'Clínica Vida',
        cnpj: '11.444.777/0001-61',
        telefone: '(11) 3456-7890',
        endereco: 'Av. Paulista, 1000',
      }),
    ).toEqual({
      name: 'Clínica Vida',
      cnpj: '11444777000161',
      phone: '1134567890',
      address: 'Av. Paulista, 1000',
    });
  });

  it('converte strings vazias em null', () => {
    expect(
      toCreateClinicRequest({ nome: 'Clínica Vida', cnpj: '', telefone: '', endereco: '' }),
    ).toEqual({ name: 'Clínica Vida', cnpj: null, phone: null, address: null });
  });

  it('normaliza cnpj para apenas dígitos', () => {
    expect(toCreateClinicRequest({ nome: 'X', cnpj: '11.444.777/0001-61' }).cnpj).toBe(
      '11444777000161',
    );
  });
});

describe('serverFieldToFormField', () => {
  it('mapeia campos do servidor para o formulário', () => {
    expect(serverFieldToFormField('name')).toBe('nome');
    expect(serverFieldToFormField('phone')).toBe('telefone');
    expect(serverFieldToFormField('address')).toBe('endereco');
    expect(serverFieldToFormField('cnpj')).toBe('cnpj');
  });

  it('retorna null para campo desconhecido', () => {
    expect(serverFieldToFormField('unknown')).toBeNull();
  });
});
