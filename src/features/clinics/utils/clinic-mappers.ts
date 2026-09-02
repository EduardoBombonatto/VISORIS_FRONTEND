import type { CreateClinicRequest } from '@/api/index.schemas';
import type { ClinicFormValues } from '../schemas/clinic.schema';

const SERVER_FIELD_TO_FORM: Record<string, keyof ClinicFormValues> = {
  name: 'nome',
  cnpj: 'cnpj',
  phone: 'telefone',
  address: 'endereco',
};

export function toCreateClinicRequest(values: ClinicFormValues): CreateClinicRequest {
  return {
    name: values.nome,
    cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : null,
    phone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
    address: values.endereco ? values.endereco : null,
  };
}

export function serverFieldToFormField(field: string): keyof ClinicFormValues | null {
  return SERVER_FIELD_TO_FORM[field] ?? null;
}
