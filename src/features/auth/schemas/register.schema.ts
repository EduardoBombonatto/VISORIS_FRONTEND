import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Nome completo é obrigatório.')
    .max(255, 'Nome completo excede o limite de 255 caracteres.'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório.')
    .email('Formato de e-mail inválido.')
    .max(255, 'E-mail excede o limite de 255 caracteres.'),
  password: z
    .string()
    .min(8, 'A senha deve conter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial.'),
  professionalDocument: z
    .string()
    .min(1, 'CRM é obrigatório.')
    .max(50, 'CRM excede o limite de 50 caracteres.')
    .regex(/\d/, 'O CRM deve conter números.')
    .regex(/[A-Za-z]{2}/, 'O CRM deve conter a UF (ex: SP).'),
  acceptTerms: z.boolean().refine((value) => value === true, 'Você deve aceitar os termos de uso.'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
