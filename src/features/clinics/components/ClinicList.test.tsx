import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ClinicList from './ClinicList';

vi.mock('@/api/clinics/clinics', () => ({
  useClinicsList: vi.fn(),
}));

import { useClinicsList } from '@/api/clinics/clinics';

const mockUseClinicsList = vi.mocked(useClinicsList);

const baseQuery = {
  isPending: false,
  isError: false,
  refetch: vi.fn(),
};

beforeEach(() => {
  mockUseClinicsList.mockReset();
  baseQuery.refetch.mockReset();
});

describe('ClinicList', () => {
  it('exibe carregamento enquanto a lista está pendente', () => {
    mockUseClinicsList.mockReturnValue({ ...baseQuery, isPending: true, data: undefined } as never);
    render(<ClinicList />);
    expect(screen.getByRole('status', { name: 'Carregando clínicas' })).toBeInTheDocument();
  });

  it('exibe erro e permite nova tentativa', () => {
    mockUseClinicsList.mockReturnValue({ ...baseQuery, isError: true, data: undefined } as never);
    render(<ClinicList />);
    expect(screen.getByText('Não foi possível carregar as clínicas.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(baseQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it('exibe empty state quando não há clínicas', () => {
    mockUseClinicsList.mockReturnValue({ ...baseQuery, data: [] } as never);
    render(<ClinicList />);
    expect(screen.getByText('Nenhuma clínica cadastrada')).toBeInTheDocument();
  });

  it('chama onAddClinic pelo CTA do empty state quando fornecido', () => {
    const onAddClinic = vi.fn();
    mockUseClinicsList.mockReturnValue({ ...baseQuery, data: [] } as never);
    render(<ClinicList onAddClinic={onAddClinic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Clínica' }));
    expect(onAddClinic).toHaveBeenCalledTimes(1);
  });

  it('não exibe CTA no empty state quando onAddClinic não é fornecido', () => {
    mockUseClinicsList.mockReturnValue({ ...baseQuery, data: [] } as never);
    render(<ClinicList />);
    expect(screen.queryByRole('button', { name: 'Adicionar Clínica' })).not.toBeInTheDocument();
  });

  it('renderiza um card por clínica', () => {
    const clinics = [
      { id: '1', name: 'Clínica Vida' },
      { id: '2', name: 'Clínica Saúde', phone: '(11) 5555-0000' },
    ];
    mockUseClinicsList.mockReturnValue({ ...baseQuery, data: clinics } as never);
    render(<ClinicList />);
    expect(screen.getByText('Clínica Vida')).toBeInTheDocument();
    expect(screen.getByText('Clínica Saúde')).toBeInTheDocument();
  });
});
