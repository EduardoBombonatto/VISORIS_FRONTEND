import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TemplateWorkspace from './TemplateWorkspace';

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/api/templates/templates', () => ({
  useListTemplates: vi.fn(),
  useGetTemplateById: vi.fn(),
  useCreateTemplate: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateTemplate: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteTemplate: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  getListTemplatesQueryKey: () => ['/api/v1/templates'],
  getGetTemplateByIdQueryKey: (id: string) => ['/api/v1/templates', id],
}));

vi.mock('./RichTextEditor', () => ({
  default: ({
    value,
    onChange,
    error,
  }: {
    value: string;
    onChange: (val: string) => void;
    error?: string;
  }) => (
    <div data-testid="mock-rich-editor">
      <textarea
        aria-label="Editor de texto mock"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span data-testid="editor-error">{error}</span> : null}
    </div>
  ),
}));

import { useListTemplates, useGetTemplateById } from '@/api/templates/templates';

const mockUseListTemplates = vi.mocked(useListTemplates);
const mockUseGetTemplateById = vi.mocked(useGetTemplateById);

const sampleTemplates = [
  { id: 't-1', title: 'EDA - Normal Padrão', createdAt: '2026-09-20T10:00:00Z' },
  { id: 't-2', title: 'Colonoscopia Padrão', createdAt: '2026-09-21T14:30:00Z' },
];

beforeEach(() => {
  mockCreateMutateAsync.mockReset();
  mockUpdateMutateAsync.mockReset();
  mockDeleteMutateAsync.mockReset();
  mockInvalidateQueries.mockReset();
  mockUseListTemplates.mockReset();
  mockUseGetTemplateById.mockReset();

  mockUseListTemplates.mockReturnValue({
    data: { data: { templates: sampleTemplates } },
    isPending: false,
    refetch: vi.fn(),
  } as never);

  mockUseGetTemplateById.mockReturnValue({
    data: {
      data: {
        id: 't-1',
        title: 'EDA - Normal Padrão',
        content: '<p>Mucosa gástrica íntegra.</p>',
      },
    },
    isPending: false,
  } as never);
});

describe('TemplateWorkspace', () => {
  it('renderiza o layout Split-View com lista de modelos e abre o editor modal ao selecionar', () => {
    render(<TemplateWorkspace />);

    expect(screen.getByText('Modelos de Laudo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Procurar modelo...')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /selecionar template eda - normal padrão/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /selecionar template colonoscopia padrão/i }),
    ).toBeInTheDocument();

    // Clica no template para abrir o formulário em popup modal com desfoque de fundo
    fireEvent.click(
      screen.getByRole('button', { name: /selecionar template eda - normal padrão/i }),
    );

    expect(screen.getByText('Editando Template')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do Template *')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rich-editor')).toBeInTheDocument();
  });

  it('filtra templates dinamicamente através do campo de busca', () => {
    render(<TemplateWorkspace />);

    const searchInput = screen.getByPlaceholderText('Procurar modelo...');
    fireEvent.change(searchInput, { target: { value: 'Colono' } });

    expect(
      screen.queryByRole('button', { name: /selecionar template eda - normal padrão/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /selecionar template colonoscopia padrão/i }),
    ).toBeInTheDocument();
  });

  it('fecha o modal de formulário ao clicar em Cancelar', () => {
    render(<TemplateWorkspace isCreatingNew />);

    expect(screen.getByText('Novo Template')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Novo Template')).not.toBeInTheDocument();
  });

  it('alterna para modo Novo Template ao clicar no botão "+"', () => {
    render(<TemplateWorkspace />);

    const newBtn = screen.getByRole('button', { name: /criar novo template/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Novo Template')).toBeInTheDocument();
    const titleInput = screen.getByLabelText('Nome do Template *') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('valida campos obrigatórios ao tentar salvar sem título ou conteúdo', async () => {
    render(<TemplateWorkspace isCreatingNew />);

    const saveBtn = screen.getByRole('button', { name: /salvar alterações/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('O título do template é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('O conteúdo do laudo é obrigatório.')).toBeInTheDocument();
    });

    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('salva alterações de um template existente com sucesso', async () => {
    render(<TemplateWorkspace initialTemplateId="t-1" />);

    const titleInput = screen.getByLabelText('Nome do Template *');
    fireEvent.change(titleInput, { target: { value: 'EDA - Normal Atualizado' } });

    const editorTextarea = screen.getByLabelText('Editor de texto mock');
    fireEvent.change(editorTextarea, { target: { value: '<p>Novo conteúdo de laudo</p>' } });

    const saveBtn = screen.getByRole('button', { name: /salvar alterações/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 't-1',
        data: {
          title: 'EDA - Normal Atualizado',
          content: '<p>Novo conteúdo de laudo</p>',
        },
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/v1/templates'],
      });
    });
  });

  it('abre modal de exclusão e confirma exclusão com sucesso', async () => {
    render(<TemplateWorkspace />);

    const deleteBtn = screen.getByRole('button', { name: /excluir template eda - normal padrão/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('"EDA - Normal Padrão"')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirmar exclusão de template/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 't-1' });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/v1/templates'],
      });
    });
  });
});
