import { z } from 'zod';

export const createAppointmentSchema = z.object({
  clinic_id: z.string({ required_error: 'Selecione uma clínica' }).min(1, 'Selecione uma clínica'),
  patient_id: z.string({ required_error: 'Selecione um paciente' }).min(1, 'Selecione um paciente'),
  scheduledDate: z.string({ required_error: 'Data é obrigatória' }).min(10, 'Data inválida'),
  scheduledTime: z.string({ required_error: 'Horário é obrigatório' }).min(5, 'Horário inválido'),
  procedure_name: z
    .string({ required_error: 'Informe o procedimento a ser realizado' })
    .trim()
    .min(2, 'Informe o procedimento a ser realizado'),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const num =
        typeof val === 'number' ? val : Number(val.trim().replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe um valor numérico válido',
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O valor não pode ser negativo',
        });
        return z.NEVER;
      }
      return num;
    }),
  payment_status: z.enum(['UNPAID', 'PAID', 'INSURANCE']).default('UNPAID'),
});

export type CreateAppointmentFormInput = z.input<typeof createAppointmentSchema>;
export type CreateAppointmentFormValues = z.output<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  exam_status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  report_status: z.enum(['PENDING', 'DRAFT', 'COMPLETED']).optional(),
  payment_status: z.enum(['UNPAID', 'PAID', 'INSURANCE']).optional(),
});

export type UpdateAppointmentStatusValues = z.infer<typeof updateAppointmentStatusSchema>;
