import { z } from 'zod';

export const templateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'O título do template é obrigatório.')
    .max(255, 'O título não pode ter mais de 255 caracteres.'),
  content: z
    .string()
    .trim()
    .min(1, 'O conteúdo do template é obrigatório.')
    .refine((val) => {
      // Remove tags HTML para validar se o usuário realmente inseriu texto
      const stripped = val.replace(/<[^>]*>/g, '').trim();
      return stripped.length > 0;
    }, 'O conteúdo do template não pode estar vazio.'),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
