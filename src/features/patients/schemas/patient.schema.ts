import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  client: z.object({
    name: z.string().min(2, 'Nome do tutor é obrigatório'),
    email: z.string().email('E-mail inválido'),
    cpf: z
      .string()
      .optional()
      .refine((val) => !val || val.replace(/\D/g, '').length === 11, {
        message: 'CPF deve ter 11 dígitos',
      }),
    phone: z.string().optional(),
  }),
  patient: z.object({
    name: z.string().min(2, 'Nome do paciente é obrigatório'),
    biological_details: z.object({
      birthDate: z.string().optional(),
      gender: z.enum(['MASCULINO', 'FEMININO', 'OUTROS']).optional(),
      bloodType: z.string().optional(),
    }),
    allergies: z.string().optional(), // Will split by comma before sending
    healthPlan: z.string().optional(),
    healthPlanNumber: z.string().optional(),
  }),
});

export type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;
