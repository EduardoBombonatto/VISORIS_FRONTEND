import { z } from 'zod';

export const MAX_IMAGE_URL_LENGTH = 1024;
export const MAX_CAPTION_LENGTH = 500;

export const reportImageFormSchema = z.object({
  image_url: z
    .string()
    .trim()
    .min(1, 'Informe uma URL de imagem ou selecione um arquivo.')
    .max(
      MAX_IMAGE_URL_LENGTH,
      `A URL da imagem não pode ter mais de ${MAX_IMAGE_URL_LENGTH} caracteres.`,
    ),
  caption: z
    .string()
    .trim()
    .max(MAX_CAPTION_LENGTH, `A legenda não pode ter mais de ${MAX_CAPTION_LENGTH} caracteres.`)
    .optional()
    .or(z.literal('')),
  display_order: z
    .number()
    .int('A ordem de exibição deve ser um número inteiro.')
    .min(0, 'A ordem de exibição deve ser maior ou igual a zero.'),
});

export type ReportImageFormData = z.infer<typeof reportImageFormSchema>;

export const reportDraftSchema = z.object({
  content: z.string(),
});

export type ReportDraftFormData = z.infer<typeof reportDraftSchema>;
