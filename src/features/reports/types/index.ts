import type { ReportImageResponse, ReportResponse } from '@/api/index.schemas';

export interface ReportPatientSnapshot {
  id?: string;
  clientId?: string | null;
  name?: string;
  patientType?: string;
  birthDate?: string | null;
  biologicalDetails?: Record<string, unknown>;
}

export interface ReportClinicSnapshot {
  id?: string;
  name?: string;
  cnpj?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface AddReportImageInput {
  image_url: string;
  caption?: string | null;
  display_order: number;
  localPreviewUrl?: string;
}

export interface TemplateImporterProps {
  currentContent: string;
  disabled?: boolean;
  onImportContent: (htmlContent: string, templateTitle: string) => void;
}

export interface ReportImageManagerProps {
  appointmentId: string;
  images: ReportImageResponse[];
  disabled?: boolean;
  isAdding?: boolean;
  onAddImage: (input: AddReportImageInput) => Promise<void>;
  onReorderImages?: (reordered: ReportImageResponse[]) => void;
  onInsertImageToEditor?: (image: ReportImageResponse, label: string) => void;
  onUpdateImageCaption?: (imageId: string, caption: string) => void;
  onRemoveImage?: (imageId: string) => void;
}

export interface ConfirmSignModalProps {
  isOpen: boolean;
  isSigning?: boolean;
  patientName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ReportWorkspaceProps {
  appointmentId: string;
  initialReport?: ReportResponse | null;
}
