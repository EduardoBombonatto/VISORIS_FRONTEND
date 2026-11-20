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

  it('permite alternar itens do checklist e chamar onConfirm e onCancel', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(<ConfirmSignModal isOpen={true} onConfirm={handleConfirm} onCancel={handleCancel} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(8);

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /confirmar e assinar/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
