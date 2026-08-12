import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ValidationError {
  field: string;
  message: string;
}

interface ApiErrorPayload {
  erro?: boolean;
  message?: string;
  data?: { errors?: ValidationError[] } | null;
  httpcode?: number;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly httpcode: number;
  readonly fieldErrors: ValidationError[];

  constructor(message: string, httpcode: number, fieldErrors: ValidationError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.httpcode = httpcode;
    this.fieldErrors = fieldErrors;
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const data = error.response?.data;

    if (data && typeof data === 'object' && 'erro' in data) {
      const fieldErrors = data.data?.errors ?? [];
      const httpcode = data.httpcode ?? error.response?.status ?? 0;
      throw new ApiError(data.message ?? 'Erro inesperado.', httpcode, fieldErrors);
    }

    if (!error.response || error.code === 'ECONNABORTED') {
      throw new ApiError('Serviço indisponível. Tente novamente.', 0, []);
    }

    throw error;
  },
);

export const customInstance = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const config: AxiosRequestConfig = {
    url,
    method: (options?.method ?? 'GET') as AxiosRequestConfig['method'],
    headers: options?.headers as Record<string, string>,
  };

  if (options?.body) {
    config.data = JSON.parse(options.body as string);
  }

  const response = await apiClient.request(config);

  return {
    data: response.data,
    status: response.status,
    headers: response.headers as unknown as Headers,
  } as T;
};

export default customInstance;
