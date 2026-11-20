import type { ReportImageResponse } from '@/api/index.schemas';
import { MAX_IMAGE_URL_LENGTH } from '../schemas/report-schema';

export const REPORT_IMAGE_DRAG_MIME = 'application/x-visoris-report-image';

export interface DraggedReportImagePayload {
  imageUrl: string;
  caption?: string | null;
  label: string;
}

/**
 * Higieniza o nome de arquivo para uso seguro em identificadores.
 */
export function sanitizeFileName(fileName: string): string {
  return (
    fileName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 120) || 'exam-image.jpg'
  );
}

/**
 * Gera um identificador determinístico (sempre <= 1024 caracteres)
 * para um arquivo selecionado localmente na sessão.
 */
export function buildSimulatedImageUrl(
  appointmentId: string,
  fileName: string,
  timestamp: number = Date.now(),
): string {
  const sanitizedAppt = appointmentId.replace(/[^a-zA-Z0-9_-]/g, '') || 'appt';
  const sanitizedName = sanitizeFileName(fileName);

  const baseUrl = `/api/uploads/${sanitizedAppt}-${timestamp}-${sanitizedName}`;
  return baseUrl.slice(0, MAX_IMAGE_URL_LENGTH);
}

/**
 * Lê um arquivo de imagem local na memória do navegador (Object URL ou Data URL)
 * para exibição imediata na galeria, na Folha A4 e na exportação do PDF.
 */
export async function readFileAsPreviewUrl(file: File, appointmentId: string): Promise<string> {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const objectUrl = URL.createObjectURL(file);
      if (objectUrl) {
        return objectUrl;
      }
    } catch {
      // Continua para FileReader ou fallback
    }
  }

  if (typeof FileReader !== 'undefined') {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string' && reader.result.length > 0) {
            resolve(reader.result);
          } else {
            reject(new Error('Falha na leitura do arquivo'));
          }
        };
        reader.onerror = () => reject(new Error('Erro no FileReader'));
        reader.readAsDataURL(file);
      });
      return dataUrl;
    } catch {
      // Fallback para ambientes de teste
    }
  }

  return buildSimulatedImageUrl(appointmentId, file.name);
}

/**
 * Resolve a URL a ser exibida na tag <img>, priorizando preview em memória
 * e fornecendo um fallback SVG caso uma URL antiga de teste seja encontrada.
 */
export function resolveRenderableImageSrc(
  imageUrl: string,
  localPreviews: Record<string, string> = {},
): string {
  if (localPreviews[imageUrl]) {
    return localPreviews[imageUrl];
  }
  if (
    imageUrl.startsWith('https://storage.visoris.local/') ||
    imageUrl.startsWith('/api/uploads/')
  ) {
    const fileName = imageUrl.split('/').pop() ?? 'Foto do Exame';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="#ecfdf5"/><rect x="12" y="12" width="296" height="196" rx="8" fill="#d1fae5" stroke="#10b981" stroke-width="2"/><text x="160" y="105" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#065f46">Imagem Clínica</text><text x="160" y="128" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#047857">${fileName.slice(0, 32)}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  return imageUrl;
}

/**
 * Ordena a lista de imagens pelo campo displayOrder crescente (e id como desempate).
 */
export function sortImagesByDisplayOrder(images: ReportImageResponse[]): ReportImageResponse[] {
  return images.toSorted((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Calcula o próximo displayOrder sequencial sugerido para uma nova imagem.
 */
export function getNextDisplayOrder(images: ReportImageResponse[]): number {
  if (images.length === 0) return 1;
  const maxOrder = Math.max(...images.map((img) => img.displayOrder));
  return Math.max(1, maxOrder + 1);
}
