import type { ClinicData } from '@/api/index.schemas';

interface ClinicsListResult {
  data?: { data?: { clinics?: ClinicData[] } | null } | null;
}

export function extractClinics(result: ClinicsListResult | null | undefined): ClinicData[] {
  return result?.data?.data?.clinics ?? [];
}
