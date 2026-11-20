import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/axios';
import type { ReportResponse } from '@/api/index.schemas';
import ReportWorkspace from './ReportWorkspace';

const mockUseGetReportByAppointmentId = vi.fn();
const mockCreateReportMutateAsync = vi.fn();
const mockUpdateReportMutateAsync = vi.fn();
const mockAddImageMutateAsync = vi.fn();
const mockSignReportMutateAsync = vi.fn();
const mockGetTemplateById = vi.fn();

vi.mock('@/api/reports/reports', () => ({
  useGetReportByAppointmentId: (...args: unknown[]) => mockUseGetReportByAppointmentId(...args),
  useCreateReport: () => ({
    mutateAsync: mockCreateReportMutateAsync,
    isPending: false,
  }),
  useUpdateReport: () => ({
    mutateAsync: mockUpdateReportMutateAsync,
    isPending: false,
  }),
  useAddReportImage: () => ({
    mutateAsync: mockAddImageMutateAsync,
    isPending: false,
  }),
  useSignReport: () => ({
    mutateAsync: mockSignReportMutateAsync,
    isPending: false,
  }),
  getGetReportByAppointmentIdQueryKey: (appointmentId: string) => [
    `/api/v1/reports/appointment/${appointmentId}`,
  ],
}));

vi.mock('@/api/appointments/appointments', () => ({
  getListAppointmentsQueryKey: () => ['/api/v1/appointments'],
  useListAppointments: () => ({
    data: {
      data: {
        appointments: [
          {
            id: 'appt-200',
            userId: 'user-1',
            clinicId: 'cli-1',
            patientId: 'pat-1',
            scheduledAt: '2026-10-21T10:00:00Z',
            procedureName: 'Endoscopia Digestiva Alta',
            examStatus: 'SCHEDULED',
            reportStatus: 'PENDING',
            paymentStatus: 'PAID',
            patientName: 'Rex',
            patientType: 'PET',
            clientName: 'Carlos Tutor',
            clinicName: 'Clínica Veterinária Central',
            createdAt: '2026-10-21T09:00:00Z',
            updatedAt: '2026-10-21T09:00:00Z',
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/api/clinics/clinics', () => ({
  useClinicsList: () => ({
    data: {
      data: {
        clinics: [
          {
            id: 'cli-1',
            name: 'Clínica Veterinária Central',
            cnpj: '12.345.678/0001-90',
            phone: '(11) 98765-4321',
            address: 'Rua das Flores, 123',
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/api/templates/templates', () => ({
  useListTemplates: () => ({
    data: {
      data: {
        data: {
          templates: [
            {
              id: 'tpl-10',
              title: 'Endoscopia Digestiva Alta - Normal',
              createdAt: '2026-10-01T10:00:00Z',
            },
          ],
        },
      },
    },
    isPending: false,
  }),
  getTemplateById: (...args: unknown[]) => mockGetTemplateById(...args),
}));

const sampleDraftReport: ReportResponse = {
  id: 'rep-500',
  appointmentId: 'appt-200',
  userId: 'user-1',
  attendanceLocationName: 'Clínica Veterinária Central',
  patientSnapshot: {
    id: 'pat-1',
    name: 'Rex',
    patientType: 'PET',
  },
  clinicSnapshot: {
    id: 'cli-1',
    name: 'Clínica Veterinária Central',
  },
  content: '<h3>Esôfago</h3><p>Calibre preservado.</p>',
  pdfUrl: null,
  signedAt: null,
  createdAt: '2026-10-21T10:00:00Z',
  updatedAt: '2026-10-21T10:05:00Z',
  images: [
    {
      id: 'img-1',
      reportId: 'rep-500',
      imageUrl: 'https://storage.visoris.local/reports/appt-200/foto1.jpg',
      caption: 'Mucosa esofágica',
      displayOrder: 1,
      createdAt: '2026-10-21T10:02:00Z',
    },
  ],
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ReportWorkspace Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplateById.mockResolvedValue({
      status: 200,
      data: {
        data: {
          id: 'tpl-10',
          userId: 'user-1',
          title: 'Endoscopia Digestiva Alta - Normal',
          content: '<h3>Estômago</h3><p>Sem lesões.</p>',
          createdAt: '2026-10-01T10:00:00Z',
          updatedAt: '2026-10-01T10:00:00Z',
        },
      },
    });
  });

  it('carrega um laudo rascunho existente e salva atualizações via PUT ao clicar em Salvar Rascunho', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: { status: 200, data: { data: sampleDraftReport } },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUpdateReportMutateAsync.mockResolvedValue({
      status: 200,
      data: { data: sampleDraftReport },
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    expect(screen.getByText(/Rex \(PET\)/)).toBeInTheDocument();
    expect(screen.getByText('Em Rascunho')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mucosa esofágica')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /salvar rascunho/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateReportMutateAsync).toHaveBeenCalledWith({
        id: 'rep-500',
        data: { content: '<h3>Esôfago</h3><p>Calibre preservado.</p>' },
      });
      expect(screen.getByText('Rascunho salvo com sucesso!')).toBeInTheDocument();
    });
  });

  it('inicializa como Novo Rascunho quando a busca retorna 404 e cria via POST ao salvar', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new ApiError('Laudo não encontrado.', 404),
      refetch: vi.fn(),
    });
    mockCreateReportMutateAsync.mockResolvedValue({
      status: 201,
      data: {
        data: {
          ...sampleDraftReport,
          id: 'rep-new-1',
          content: '',
          images: [],
        },
      },
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    expect(screen.getByText('Novo Rascunho')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => {
      expect(mockCreateReportMutateAsync).toHaveBeenCalledWith({
        data: {
          appointment_id: 'appt-200',
          content: expect.stringContaining('Indicação Clínica'),
        },
      });
      expect(screen.getByText('Rascunho salvo com sucesso!')).toBeInTheDocument();
    });
  });

  it('importa um template no editor através do seletor Importar Template', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new ApiError('Laudo não encontrado.', 404),
      refetch: vi.fn(),
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    const select = screen.getByRole('combobox', { name: /importar template/i });
    fireEvent.change(select, { target: { value: 'tpl-10' } });

    const confirmBtn = await screen.findByRole('button', {
      name: /confirmar importação/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Template "Endoscopia Digestiva Alta - Normal" importado para o editor.'),
      ).toBeInTheDocument();
    });
  });

  it('adiciona fotos em memória na galeria ao selecionar arquivo na dropzone, insere na Folha A4 e abre Visualizar PDF', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new ApiError('Laudo não encontrado.', 404),
      refetch: vi.fn(),
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    const fileInput = screen.getByLabelText(/selecionar arquivo de imagem/i);
    const file = new File(['dummy-image-bytes'], 'exame-esofago.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Foto 01')).toBeInTheDocument();
    });

    const captionInput = screen.getByLabelText('Legenda da Foto 01');
    fireEvent.change(captionInput, {
      target: { value: 'Bulbo duodenal normal' },
    });

    fireEvent.click(screen.getByRole('button', { name: /inserir foto 01 na folha a4/i }));

    expect(screen.getByText('Foto 01 inserida na Folha A4.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /visualizar pdf/i }));
    expect(
      screen.getByRole('dialog', {
        name: /pré-visualização do documento pdf/i,
      }),
    ).toBeInTheDocument();
  });

  it('finaliza e assina o laudo via POST /sign após confirmação e alterna para modo somente leitura', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: { status: 200, data: { data: sampleDraftReport } },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    mockSignReportMutateAsync.mockResolvedValue({
      status: 200,
      data: {
        data: {
          ...sampleDraftReport,
          signedAt: '2026-10-21T12:30:00Z',
        },
      },
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    fireEvent.click(screen.getByRole('button', { name: /finalizar e assinar laudo/i }));

    expect(screen.getByRole('dialog', { name: /finalizar e assinar laudo/i })).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));

    fireEvent.click(screen.getByRole('button', { name: /confirmar e assinar/i }));

    await waitFor(() => {
      expect(mockSignReportMutateAsync).toHaveBeenCalledWith({
        id: 'rep-500',
      });
      expect(screen.getByText('Laudo assinado e finalizado com sucesso!')).toBeInTheDocument();
      expect(screen.getByText(/✓ Laudo Assinado/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /salvar rascunho/i })).not.toBeInTheDocument();
    });
  });

  it('renderiza dados da clínica e do médico no ReportPdfDocument ao abrir Visualizar PDF', async () => {
    mockUseGetReportByAppointmentId.mockReturnValue({
      data: { status: 200, data: { data: sampleDraftReport } },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQueryClient(<ReportWorkspace appointmentId="appt-200" />);

    fireEvent.click(screen.getByRole('button', { name: /visualizar pdf/i }));

    const previewModal = screen.getByRole('dialog', {
      name: /pré-visualização do documento pdf/i,
    });
    expect(previewModal).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /imprimir \/ baixar pdf/i })).toBeInTheDocument();
    expect(screen.getByTestId('report-pdf-document')).toBeInTheDocument();
  });
});
