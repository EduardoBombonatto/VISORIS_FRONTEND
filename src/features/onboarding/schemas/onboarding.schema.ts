import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome da clínica é obrigatório.')
    .max(255, 'Nome da clínica deve ter no máximo 255 caracteres.'),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
