import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemplateImporter from './TemplateImporter';

const mockGetTemplateById = vi.fn();

vi.mock('@/api/templates/templates', () => ({
  useListTemplates: () => ({
    data: {
      data: {
        data: {
          templates: [
            {
              id: 't1',
              title: 'Endoscopia Digestiva Alta - Normal',
              createdAt: '2026-10-01T10:00:00Z',
            },
            {
              id: 't2',
              title: 'Gastrite Enantematosa Leve',
              createdAt: '2026-10-02T10:00:00Z',
            },
          ],
        },
      },
    },
    isPending: false,
  }),
  getTemplateById: (...args: unknown[]) => mockGetTemplateById(...args),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TemplateImporter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplateById.mockResolvedValue({
      status: 200,
      data: {
        data: {
          id: 't1',
          userId: 'u1',
          title: 'Endoscopia Digestiva Alta - Normal',
          content: '<h3>Esôfago</h3><p>Mucosa normal.</p>',
          createdAt: '2026-10-01T10:00:00Z',
          updatedAt: '2026-10-01T10:00:00Z',
        },
      },
    });
  });

  it('lista os templates do médico no seletor Importar Template', () => {
    const onImport = vi.fn();
    renderWithClient(<TemplateImporter currentContent="" onImportContent={onImport} />);

    const select = screen.getByRole('combobox', { name: /importar template/i });
    expect(select).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Endoscopia Digestiva Alta - Normal' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gastrite Enantematosa Leve' })).toBeInTheDocument();
  });

  it('injeta diretamente o conteúdo quando o editor está vazio', async () => {
    const onImport = vi.fn();
    renderWithClient(<TemplateImporter currentContent="<p></p>" onImportContent={onImport} />);

    const select = screen.getByRole('combobox', { name: /importar template/i });
    fireEvent.change(select, { target: { value: 't1' } });

    await waitFor(() => {
      expect(mockGetTemplateById).toHaveBeenCalledWith('t1');
      expect(onImport).toHaveBeenCalledWith(
        '<h3>Esôfago</h3><p>Mucosa normal.</p>',
        'Endoscopia Digestiva Alta - Normal',
      );
    });
  });

  it('solicita confirmação quando o editor já possui conteúdo redigido', async () => {
    const onImport = vi.fn();
    renderWithClient(
      <TemplateImporter
        currentContent="<p>Achados prévios digitados pelo médico</p>"
        onImportContent={onImport}
      />,
    );

    const select = screen.getByRole('combobox', { name: /importar template/i });
    fireEvent.change(select, { target: { value: 't1' } });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /substituir conteúdo do laudo/i }),
      ).toBeInTheDocument();
    });

    expect(onImport).not.toHaveBeenCalled();

    const confirmBtn = screen.getByRole('button', {
      name: /confirmar importação/i,
    });
    fireEvent.click(confirmBtn);

    expect(onImport).toHaveBeenCalledWith(
      '<h3>Esôfago</h3><p>Mucosa normal.</p>',
      'Endoscopia Digestiva Alta - Normal',
    );
  });

  it('solicita confirmação quando o editor possui imagem sem texto', async () => {
    const onImport = vi.fn();
    renderWithClient(
      <TemplateImporter
        currentContent='<p><img src="https://example.com/exam.jpg"></p>'
        onImportContent={onImport}
      />,
    );

    const select = screen.getByRole('combobox', { name: /importar template/i });
    fireEvent.change(select, { target: { value: 't1' } });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /substituir conteúdo do laudo/i }),
      ).toBeInTheDocument();
    });

    expect(onImport).not.toHaveBeenCalled();
  });
});
