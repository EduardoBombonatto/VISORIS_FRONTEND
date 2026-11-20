import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  it('não renderiza conteúdo quando fechado', () => {
    render(
      <Modal open={false} title="Adicionar Clínica" onClose={() => {}}>
        Conteúdo
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza diálogo nativo com título e conteúdo quando aberto', () => {
    render(
      <Modal open title="Adicionar Clínica" onClose={() => {}}>
        Conteúdo do formulário
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('closedby', 'any');
    expect(screen.getByText('Adicionar Clínica')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do formulário')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Adicionar Clínica" onClose={onClose}>
        Conteúdo
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose no evento nativo cancel (tecla Escape)', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Adicionar Clínica" onClose={onClose}>
        Conteúdo
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar no backdrop (light-dismiss fallback)', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Adicionar Clínica" onClose={onClose}>
        Conteúdo
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não fecha ao clicar dentro do diálogo', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Adicionar Clínica" onClose={onClose}>
        Conteúdo
      </Modal>,
    );
    fireEvent.click(screen.getByText('Conteúdo'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignora evento close assíncrono residual enquanto o diálogo permanece aberto (StrictMode)', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Adicionar Clínica" onClose={onClose}>
        Conteúdo
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.dispatchEvent(new Event('close'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
