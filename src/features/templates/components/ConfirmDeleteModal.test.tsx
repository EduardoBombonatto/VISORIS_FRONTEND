import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  it('não renderiza nada quando open é false', () => {
    render(
      <ConfirmDeleteModal
        open={false}
        templateTitle="EDA Padrão"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza o título do template e mensagem de confirmação quando open é true', () => {
    render(
      <ConfirmDeleteModal
        open={true}
        templateTitle="EDA - Normal Padrão"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Excluir Modelo de Laudo')).toBeInTheDocument();
    expect(screen.getByText('"EDA - Normal Padrão"')).toBeInTheDocument();
    expect(
      screen.getByText(/esta ação é irreversível e removerá permanentemente o modelo/i),
    ).toBeInTheDocument();
  });

  it('chama onConfirm ao clicar em Sim, excluir', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDeleteModal
        open={true}
        templateTitle="EDA Padrão"
        onConfirm={handleConfirm}
        onClose={vi.fn()}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /confirmar exclusão de template/i });
    fireEvent.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar em Cancelar', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmDeleteModal
        open={true}
        templateTitle="EDA Padrão"
        onConfirm={vi.fn()}
        onClose={handleClose}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('fecha no evento nativo cancel (tecla Escape)', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmDeleteModal
        open={true}
        templateTitle="EDA Padrão"
        onConfirm={vi.fn()}
        onClose={handleClose}
      />,
    );

    const dialog = screen.getByRole('dialog');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('desabilita botões e exibe "Excluindo..." durante isDeleting', () => {
    render(
      <ConfirmDeleteModal
        open={true}
        templateTitle="EDA Padrão"
        isDeleting={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByText('Excluindo...')).toBeInTheDocument();
  });
});
