import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TemplateList from './TemplateList';

const mockMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('@/api/templates/templates', () => ({
  useListTemplates: vi.fn(),
  useDeleteTemplate: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  getListTemplatesQueryKey: () => ['/api/v1/templates'],
}));

import { useListTemplates } from '@/api/templates/templates';

const mockUseListTemplates = vi.mocked(useListTemplates);

const baseQuery = {
  isPending: false,
  isError: false,
  refetch: vi.fn(),
};

beforeEach(() => {
  mockUseListTemplates.mockReset();
  mockMutateAsync.mockReset();
  mockInvalidateQueries.mockReset();
  baseQuery.refetch.mockReset();
});

describe('TemplateList', () => {
  it('exibe carregamento com status e skeletons quando isPending é true', () => {
    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      isPending: true,
      data: undefined,
    } as never);

    render(<TemplateList />);

    expect(screen.getByRole('status', { name: 'Carregando templates' })).toBeInTheDocument();
  });

  it('exibe mensagem de erro e botão de repetição quando isError é true', () => {
    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      isError: true,
      data: undefined,
    } as never);

    render(<TemplateList />);

    expect(
      screen.getByText('Não foi possível carregar os templates de laudo.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(baseQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it('exibe empty state informativo quando não há templates cadastrados', () => {
    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      data: { data: { templates: [] } },
    } as never);

    render(<TemplateList />);

    expect(screen.getByText('Nenhum template cadastrado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Crie seu primeiro modelo de laudo clínico para acelerar o preenchimento de diagnósticos.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo Template' })).toHaveAttribute(
      'href',
      '/templates/new',
    );
  });

  it('renderiza os templates na tabela com título, data e botões de ação', () => {
    const templates = [
      {
        id: '101',
        title: 'EDA - Normal Padrão',
        createdAt: '2026-09-20T10:00:00Z',
      },
      {
        id: '102',
        title: 'Colonoscopia Padrão',
        createdAt: '2026-09-21T14:30:00Z',
      },
    ];

    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      data: { data: { templates } },
    } as never);

    render(<TemplateList />);

    expect(screen.getByText('EDA - Normal Padrão')).toBeInTheDocument();
    expect(screen.getByText('Colonoscopia Padrão')).toBeInTheDocument();

    const editLinks = screen.getAllByRole('link', { name: /editar template/i });
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', '/templates/101');
    expect(editLinks[1]).toHaveAttribute('href', '/templates/102');

    const deleteButtons = screen.getAllByRole('button', { name: /excluir template/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('filtra templates dinamicamente pelo termo digitado na busca', () => {
    const templates = [
      {
        id: '101',
        title: 'EDA - Normal Padrão',
        createdAt: '2026-09-20T10:00:00Z',
      },
      {
        id: '102',
        title: 'Colonoscopia Padrão',
        createdAt: '2026-09-21T14:30:00Z',
      },
    ];

    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      data: { data: { templates } },
    } as never);

    render(<TemplateList />);

    const searchInput = screen.getByLabelText(/buscar template por título/i);
    fireEvent.change(searchInput, { target: { value: 'Colono' } });

    expect(screen.queryByText('EDA - Normal Padrão')).not.toBeInTheDocument();
    expect(screen.getByText('Colonoscopia Padrão')).toBeInTheDocument();
  });

  it('abre o modal de confirmação de exclusão e executa mutação ao confirmar', async () => {
    const templates = [
      {
        id: '101',
        title: 'EDA - Normal Padrão',
        createdAt: '2026-09-20T10:00:00Z',
      },
    ];

    mockUseListTemplates.mockReturnValue({
      ...baseQuery,
      data: { data: { templates } },
    } as never);

    render(<TemplateList />);

    const deleteBtn = screen.getByRole('button', { name: /excluir template eda - normal padrão/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('"EDA - Normal Padrão"')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirmar exclusão de template/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: '101' });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/v1/templates'],
      });
    });
  });
});
