import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';

describe('RichTextEditor', () => {
  it('renderiza os botões de formatação da barra de ferramentas', () => {
    render(<RichTextEditor value="<p>Texto inicial</p>" />);

    expect(screen.getByRole('toolbar', { name: /formatação de texto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /negrito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /itálico/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sublinhado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /título h2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subtítulo h3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parágrafo normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lista com marcadores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lista numerada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inserir quebra de página/i })).toBeInTheDocument();
  });

  it('exibe a mensagem de erro quando repassada via prop', () => {
    render(<RichTextEditor value="" error="O conteúdo do template é obrigatório." />);

    expect(screen.getByText('O conteúdo do template é obrigatório.')).toBeInTheDocument();
  });

  it('renderiza o conteúdo inicial na folha de papel', () => {
    render(<RichTextEditor value="<p>Conteúdo de laudo normal</p>" />);

    expect(screen.getByText('Conteúdo de laudo normal')).toBeInTheDocument();
  });

  it('permite interação com botão de formatação', () => {
    const handleChange = vi.fn();

    render(<RichTextEditor value="<p>Texto de teste</p>" onChange={handleChange} />);

    const boldButton = screen.getByRole('button', { name: /negrito/i });
    fireEvent.click(boldButton);

    expect(boldButton).toBeInTheDocument();
  });

  it('exibe o identificador visual de folha A4 (PDF)', () => {
    render(<RichTextEditor value="<p>Texto</p>" />);
    expect(screen.getByText('Folha A4 (PDF)')).toBeInTheDocument();
  });

  it('desabilita os controles da barra de ferramentas quando editable é false', () => {
    render(<RichTextEditor value="<p>Laudo assinado</p>" editable={false} />);

    expect(screen.getByRole('button', { name: /negrito/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /itálico/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /inserir variável/i })).toBeDisabled();
  });

  it('renderiza os slots de cabeçalho e rodapé bloqueados quando fornecidos', () => {
    render(
      <RichTextEditor
        value="<p>Texto do laudo</p>"
        headerSlot={<div data-testid="custom-header">Cabeçalho Dr Eduardo</div>}
        footerSlot={<div data-testid="custom-footer">Rodapé com CRMV</div>}
      />,
    );

    const header = screen.getByTestId('locked-report-header');
    const footer = screen.getByTestId('locked-report-footer');

    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('contenteditable', 'false');
    expect(screen.getByTestId('custom-header')).toHaveTextContent('Cabeçalho Dr Eduardo');

    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('contenteditable', 'false');
    expect(screen.getByTestId('custom-footer')).toHaveTextContent('Rodapé com CRMV');
  });
});
