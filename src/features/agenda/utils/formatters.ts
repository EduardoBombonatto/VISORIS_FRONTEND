/**
 * Formatadores e utilitários de data, hora e moeda para a Agenda (Intl nativo).
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Formata um valor numérico em Real Brasileiro (BRL) - Ex: R$ 450,00
 */
export function formatCurrencyBRL(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return currencyFormatter.format(value);
}

/**
 * Formata data/hora ISO ou objeto Date para horário HH:mm - Ex: 08:30
 */
export function formatTimeHHmm(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--:--';
    return timeFormatter.format(d);
  } catch {
    return '--:--';
  }
}

/**
 * Formata uma data por extenso em português - Ex: "Quarta-feira, 16 de Setembro de 2026"
 */
export function formatLongDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const formatted = longDateFormatter.format(d);
    // Capitaliza a primeira letra
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return '';
  }
}

/**
 * Converte um Date para string YYYY-MM-DD no fuso horário local
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna os limites ISO 8601 (início e término) de um dia para envio à API
 */
export function getDayRangeISO(date: Date): { startDate: string; endDate: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Mescla uma string de data local (YYYY-MM-DD) e horário (HH:mm) para ISO 8601 UTC
 */
export function parseDateAndTimeToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
}

/**
 * Utilitários para desempacotar listas de respostas envelopadas da API
 */
export function extractClinicsList(res: unknown): import('@/api/index.schemas').ClinicData[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as {
    data?: {
      data?: { clinics?: import('@/api/index.schemas').ClinicData[] } | null;
      clinics?: import('@/api/index.schemas').ClinicData[];
    } | null;
  };
  return root.data?.data?.clinics ?? root.data?.clinics ?? [];
}

export function extractClientsList(res: unknown): import('@/api/index.schemas').ClientResponse[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as {
    data?: {
      data?: { clients?: import('@/api/index.schemas').ClientResponse[] } | null;
      clients?: import('@/api/index.schemas').ClientResponse[];
    } | null;
  };
  return root.data?.data?.clients ?? root.data?.clients ?? [];
}

export function extractPatientsList(res: unknown): import('@/api/index.schemas').PatientResponse[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as {
    data?: {
      data?: { patients?: import('@/api/index.schemas').PatientResponse[] } | null;
      patients?: import('@/api/index.schemas').PatientResponse[];
    } | null;
  };
  return root.data?.data?.patients ?? root.data?.patients ?? [];
}

export function extractAppointmentsList(
  res: unknown,
): import('@/api/index.schemas').AppointmentResponse[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as {
    data?: {
      data?: { appointments?: import('@/api/index.schemas').AppointmentResponse[] } | null;
      appointments?: import('@/api/index.schemas').AppointmentResponse[];
    } | null;
    appointments?: import('@/api/index.schemas').AppointmentResponse[];
  };
  return root.data?.data?.appointments ?? root.data?.appointments ?? root.appointments ?? [];
}
