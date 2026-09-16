import { z } from 'zod';

export const petSchema = z
  .object({
    species: z.string().min(1, 'Espécie é obrigatória'),
    name: z.string().min(1, 'Nome do pet é obrigatório'),
    birthDate: z.string().optional(),
    age: z.string().optional(),
    breed: z.string().min(1, 'Raça é obrigatória'),
    coatColor: z.string().min(1, 'Cor da pelagem é obrigatória'),
  })
  .refine((data) => !!data.birthDate || (!!data.age && data.age.trim().length > 0), {
    message: 'Informe a data de nascimento ou a idade do pet',
    path: ['birthDate'],
  });

export type PetFormData = z.infer<typeof petSchema>;

export const tutorSchema = z.object({
  name: z.string().min(2, 'Nome do tutor é obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 11, {
      message: 'CPF deve ter 11 dígitos',
    }),
  phone: z.string().optional(),
});

export type TutorFormData = z.infer<typeof tutorSchema>;

export const patientRegistrationSchema = z.object({
  client: tutorSchema,
  patient: petSchema,
});

export type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;

export const patientFormSchema = z.object({
  client: tutorSchema.optional(),
  patient: petSchema,
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const multiPatientFormSchema = z.object({
  client: tutorSchema.optional(),
  patients: z.array(petSchema).min(1, 'Adicione pelo menos um pet'),
});

export type MultiPatientFormValues = z.infer<typeof multiPatientFormSchema>;

export const clientUpdateSchema = z.object({
  name: z.string().min(2, 'Nome do tutor é obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 11, {
      message: 'CPF deve ter 11 dígitos',
    }),
  phone: z.string().optional(),
});

export type ClientUpdateFormData = z.infer<typeof clientUpdateSchema>;

export const patientUpdateSchema = petSchema;
export type PatientUpdateFormData = PetFormData;
