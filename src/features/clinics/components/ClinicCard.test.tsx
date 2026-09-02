import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClinicCard from './ClinicCard';

describe('ClinicCard', () => {
  it('renderiza o nome da clínica', () => {
    render(<ClinicCard clinic={{ id: '1', name: 'Clínica Vida' }} />);
    expect(screen.getByText('Clínica Vida')).toBeInTheDocument();
  });

  it('mostra CNPJ, telefone e endereço quando preenchidos', () => {
    render(
      <ClinicCard
        clinic={{
          id: '1',
          name: 'Clínica Vida',
          cnpj: '11444777000161',
          phone: '(11) 5555-0000',
          address: 'Av. Paulista, 1000',
        }}
      />,
    );
    expect(screen.getByText('11444777000161')).toBeInTheDocument();
    expect(screen.getByText('(11) 5555-0000')).toBeInTheDocument();
    expect(screen.getByText('Av. Paulista, 1000')).toBeInTheDocument();
  });

  it('mostra placeholder quando CNPJ, telefone ou endereço estão ausentes', () => {
    const { container } = render(<ClinicCard clinic={{ id: '1', name: 'Clínica Vida' }} />);
    const values = container.querySelectorAll('[data-field-value]');
    expect(values.length).toBeGreaterThan(0);
    values.forEach((node) => expect(node.textContent).toBe('—'));
  });
});
