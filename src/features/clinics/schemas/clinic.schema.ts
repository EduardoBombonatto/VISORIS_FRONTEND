import { z } from 'zod';
import { isCnpjValid } from '../utils/cnpj';

export const clinicSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(255, 'O nome deve ter no máximo 255 caracteres.'),
  cnpj: z
    .string()
    .trim()
    .optional()
    .refine((value) => value === undefined || value === '' || isCnpjValid(value), {
      message: 'CNPJ inválido.',
    }),
  telefone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        value === undefined || value === '' || /^\d{10,11}$/.test(value.replace(/\D/g, '')),
      { message: 'Telefone inválido.' },
    ),
  endereco: z.string().trim().max(255, 'O endereço deve ter no máximo 255 caracteres.').optional(),
});

export type ClinicFormValues = z.infer<typeof clinicSchema>;
