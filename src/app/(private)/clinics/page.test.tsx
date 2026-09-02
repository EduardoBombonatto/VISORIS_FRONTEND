import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClinicsPage from './page';

vi.mock('@/api/clinics/clinics', () => ({
  useClinicsList: vi.fn(),
  useClinicsCreate: vi.fn(),
  getClinicsListQueryKey: () => ['/api/v1/clinics'],
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

describe('ClinicsPage', () => {
  it('exibe um único botão Adicionar Clínica quando não há clínicas (empty state)', () => {
    mockUseClinicsList.mockReturnValue({ ...baseQuery, data: [] } as never);
    render(<ClinicsPage />);

    const buttons = screen.getAllByRole('button', { name: 'Adicionar Clínica' });
    expect(buttons).toHaveLength(1);
    expect(screen.getByText('Nenhuma clínica cadastrada')).toBeInTheDocument();
  });

  it('exibe um único botão Adicionar Clínica no cabeçalho quando há clínicas', () => {
    mockUseClinicsList.mockReturnValue({
      ...baseQuery,
      data: [{ id: '1', name: 'Clínica Vida' }],
    } as never);
    render(<ClinicsPage />);

    const buttons = screen.getAllByRole('button', { name: 'Adicionar Clínica' });
    expect(buttons).toHaveLength(1);
    expect(screen.queryByText('Nenhuma clínica cadastrada')).not.toBeInTheDocument();
    expect(screen.getByText('Clínica Vida')).toBeInTheDocument();
  });
});
