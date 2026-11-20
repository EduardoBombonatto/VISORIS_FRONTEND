import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReportPdfDocument from './ReportPdfDocument';

describe('ReportPdfDocument', () => {
  it('renderiza o cabeçalho dinâmico com médico e clínica, snapshot estruturado, título, corpo, galeria e rodapé', () => {
    render(
      <ReportPdfDocument
        clinic={{
          name: 'Hospital Animal Care',
          address: 'Cascavel, PR',
        }}
        doctor={{
          name: 'Dr. Eduardo Bombonatto',
          professionalDocument: 'CRMV-PR 12345',
          specialty: 'Especialista em Endoscopia e Imagem Veterinária',
        }}
        patient={{
          name: 'Thor',
          species: 'Canino',
          breed: 'Golden',
          gender: 'Macho',
          age: '3 anos',
          birthDate: '2023-05-12',
          weight: '32.5 kg',
          covenant: 'Particular',
        }}
        appointment={{
          procedureName: 'Endoscopia Respiratória',
          clientName: 'Marcos Silva',
          scheduledAt: '2026-10-21T14:00:00Z',
        }}
        content="<h4>Indicação Clínica</h4><p>Tosse crônica.</p><h4>Conclusão</h4><p>Traqueobronquite.</p>"
        images={[
          {
            id: 'img-1',
            reportId: 'rep-1',
            imageUrl: 'https://cdn.visoris.local/img1.jpg',
            caption: 'Mucosa traqueal hiperêmica.',
            displayOrder: 1,
            createdAt: '2026-10-21T14:00:00Z',
          },
        ]}
        isSigned={true}
        signedAt="2026-10-21T14:45:00Z"
        reportId="rep-100"
      />,
    );

    // 1. Cabeçalho
    expect(screen.getAllByText('Dr. Eduardo Bombonatto').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CRMV-PR 12345/).length).toBeGreaterThan(0);
    expect(screen.getByText('Especialista em Endoscopia e Imagem Veterinária')).toBeInTheDocument();
    expect(screen.getByText('Hospital Animal Care')).toBeInTheDocument();
    expect(screen.getByText('Cascavel, PR')).toBeInTheDocument();

    // 2. Snapshot
    expect(screen.getByText(/Thor/)).toBeInTheDocument();
    expect(screen.getByText(/(Canino, Golden)/)).toBeInTheDocument();
    expect(screen.getByText('Marcos Silva')).toBeInTheDocument();
    expect(screen.getByText(/3 anos/)).toBeInTheDocument();
    expect(screen.getByText(/Macho • 32.5 kg/)).toBeInTheDocument();
    expect(screen.getByText('Particular')).toBeInTheDocument();

    // 3. Título
    expect(screen.getByText('Laudo de Endoscopia Respiratória')).toBeInTheDocument();

    // 4. Conteúdo
    expect(screen.getByText('Tosse crônica.')).toBeInTheDocument();
    expect(screen.getByText('Traqueobronquite.')).toBeInTheDocument();

    // 5. Galeria
    expect(screen.getByText('Fig 1. Mucosa traqueal hiperêmica.')).toBeInTheDocument();

    // 6. Rodapé
    expect(screen.getByText(/Documento finalizado e assinado digitalmente/)).toBeInTheDocument();
    expect(screen.getByText(/Hash de Autenticidade:/)).toBeInTheDocument();
  });

  it('exibe indicação de rascunho quando o laudo ainda não está assinado', () => {
    render(
      <ReportPdfDocument
        doctor={{
          name: 'Dr. Roberto',
          professionalDocument: 'CRMV-RJ 9999',
        }}
        content="<p>Texto em edição</p>"
        isSigned={false}
      />,
    );

    expect(
      screen.getByText(/Documento em rascunho • Aguardando assinatura oficial/i),
    ).toBeInTheDocument();
  });

  it('divide o laudo em múltiplas folhas A4 quando existe quebra de página', () => {
    const multiPageContent = `
      <p>Conteúdo da Folha 1</p>
      <div class="report-page-break" data-page-break="true">
        <span class="report-page-break-label">Quebra</span>
      </div>
      <p>Conteúdo da Folha 2</p>
    `;

    render(
      <ReportPdfDocument
        doctor={{
          name: 'Dr. Eduardo Bombonatto',
          professionalDocument: 'CRMV-PR 12345',
        }}
        clinic={{
          name: 'Hospital Animal Care',
        }}
        patient={{
          name: 'Thor',
        }}
        content={multiPageContent}
      />,
    );

    // Deve exibir identificador de folhas
    expect(screen.getAllByText('Folha 1 de 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Folha 2 de 2').length).toBeGreaterThan(0);

    // Folha 1 tem o conteúdo da página 1, a assinatura oficial (SEMPRE na 1ª folha) e aviso de continuação
    expect(screen.getByText('Conteúdo da Folha 1')).toBeInTheDocument();
    expect(screen.getByText('Continua na folha seguinte →')).toBeInTheDocument();
    const sheet1 = screen.getByText('Conteúdo da Folha 1').closest('[data-page-number="1"]');
    expect(sheet1).toBeInTheDocument();
    expect(sheet1).toHaveTextContent('Dr. Eduardo Bombonatto');
    expect(sheet1).toHaveTextContent('CRMV-PR 12345');
    expect(sheet1).toHaveTextContent('Hash de Autenticidade:');

    // Folha 2 tem o cabeçalho de continuação e conteúdo da página 2
    expect(screen.getByText('Conteúdo da Folha 2')).toBeInTheDocument();
    expect(screen.getByText(/Laudo de Endoscopia • Paciente:/)).toBeInTheDocument();
  });
});
