import type {
  TemplateSummaryResponse,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '@/api/index.schemas';
import type { TemplateFormData } from '../schemas/template-schema';

export type {
  TemplateSummaryResponse,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateFormData,
};

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  error?: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export interface TemplateFormProps {
  initialData?: TemplateDetailResponse;
  onSubmit: (data: TemplateFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  serverError?: string | null;
  onCancel?: () => void;
}
