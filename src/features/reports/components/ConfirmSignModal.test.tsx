import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmSignModal from './ConfirmSignModal';

describe('ConfirmSignModal', () => {
  it('exibe o checklist completo de 8 itens antes de finalizar', () => {
    render(
      <ConfirmSignModal isOpen={true} patientName="Rex" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByText(/Checklist antes de finalizar/i)).toBeInTheDocument();
    expect(
      screen.getByText('Paciente, tutor e exame estão identificados corretamente?'),
    ).toBeInTheDocument();
    expect(screen.getByText('A data corresponde ao atendimento?')).toBeInTheDocument();
    expect(screen.getByText('A técnica está registrada?')).toBeInTheDocument();
    expect(screen.getByText('Os achados estão organizados e legíveis?')).toBeInTheDocument();
    expect(
      screen.getByText('A conclusão está coerente com o que foi descrito?'),
    ).toBeInTheDocument();
    expect(screen.getByText('As imagens pertencem ao caso correto?')).toBeInTheDocument();
    expect(
      screen.getByText('O responsável e a assinatura estão identificados?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('O arquivo final é a versão que deve ser enviada?'),
    ).toBeInTheDocument();
  });

  it('inicia com itens desmarcados, bloqueia confirmação até marcar todos e reseta ao reabrir', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    const { rerender } = render(
      <ConfirmSignModal isOpen={true} onConfirm={handleConfirm} onCancel={handleCancel} />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(8);
    checkboxes.forEach((cb) => expect(cb).not.toBeChecked());

    const confirmBtn = screen.getByRole('button', { name: /confirmar e assinar/i });
    expect(confirmBtn).toBeDisabled();

    checkboxes.forEach((cb) => fireEvent.click(cb));
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    rerender(<ConfirmSignModal isOpen={false} onConfirm={handleConfirm} onCancel={handleCancel} />);
    rerender(<ConfirmSignModal isOpen={true} onConfirm={handleConfirm} onCancel={handleCancel} />);

    const reopenedCheckboxes = screen.getAllByRole('checkbox');
    reopenedCheckboxes.forEach((cb) => expect(cb).not.toBeChecked());
    expect(screen.getByRole('button', { name: /confirmar e assinar/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
