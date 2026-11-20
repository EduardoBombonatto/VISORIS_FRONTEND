import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TemplateForm from './TemplateForm';

describe('TemplateForm', () => {
  it('renderiza o formulário em modo de criação por padrão', () => {
    render(<TemplateForm onSubmit={vi.fn()} />);

    expect(screen.getByText('Novo Modelo de Laudo')).toBeInTheDocument();
    expect(screen.getByLabelText(/título do template/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Salvar Template' })).toBeInTheDocument();
  });

  it('exibe erros de validação quando submetido com campos vazios', async () => {
    const handleSubmit = vi.fn();
    render(<TemplateForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: 'Salvar Template' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('O título do template é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('O conteúdo do template é obrigatório.')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submete dados válidos chamando onSubmit', async () => {
    const handleSubmit = vi.fn();
    const initialData = {
      id: '',
      userId: '1',
      title: 'Ultrassom Abdominal',
      content: '<p>Fígado com dimensões normais e ecotextura homogênea.</p>',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    };

    render(<TemplateForm initialData={initialData} onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: 'Salvar Template' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ultrassom Abdominal',
        content: '<p>Fígado com dimensões normais e ecotextura homogênea.</p>',
      }),
      expect.anything(),
    );
  });

  it('renderiza dados pré-preenchidos em modo de edição', () => {
    const initialData = {
      id: '99',
      userId: '1',
      title: 'EDA - Normal',
      content: '<p>Esôfago e estômago normais.</p>',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    };

    render(<TemplateForm initialData={initialData} onSubmit={vi.fn()} />);

    expect(screen.getByText('Editar Modelo de Laudo')).toBeInTheDocument();
    expect(screen.getByLabelText(/título do template/i)).toHaveValue('EDA - Normal');
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument();
  });

  it('submete dados atualizados em modo de edição', async () => {
    const handleSubmit = vi.fn();
    const initialData = {
      id: '99',
      userId: '1',
      title: 'EDA - Normal',
      content: '<p>Esôfago e estômago normais.</p>',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    };

    render(<TemplateForm initialData={initialData} onSubmit={handleSubmit} />);

    const titleInput = screen.getByLabelText(/título do template/i);
    fireEvent.change(titleInput, { target: { value: 'EDA - Alterado' } });

    const submitBtn = screen.getByRole('button', { name: 'Salvar Alterações' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'EDA - Alterado',
        content: '<p>Esôfago e estômago normais.</p>',
      }),
      expect.anything(),
    );
  });

  it('desabilita botões e exibe "Salvando..." durante isSubmitting', () => {
    render(<TemplateForm onSubmit={vi.fn()} isSubmitting={true} onCancel={vi.fn()} />);

    const saveBtn = screen.getByRole('button', { name: 'Salvando...' });
    expect(saveBtn).toBeDisabled();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(cancelBtn).toBeDisabled();
  });

  it('exibe alerta de erro do servidor quando fornecido', () => {
    render(<TemplateForm onSubmit={vi.fn()} serverError="Erro ao salvar template no servidor." />);

    expect(screen.getByText('Erro ao salvar template no servidor.')).toBeInTheDocument();
  });
});
