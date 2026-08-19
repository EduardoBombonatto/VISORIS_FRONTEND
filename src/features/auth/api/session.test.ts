import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customInstance } from '@/lib/axios';
import { fetchSession } from './session';

const envelope = {
  data: {
    erro: false,
    message: 'Sessão restaurada com sucesso.',
    data: {
      user: {
        id: '8712345678901234567',
        fullName: 'Dra. Maria Souza',
        professionalDocument: 'CRM/SP 123456',
      },
      workspaces: [],
    },
    httpcode: 200,
    timestamp: '2026-08-18T00:00:00Z',
  },
};

vi.mock('@/lib/axios', () => ({
  customInstance: vi.fn(),
}));

const mockedCustomInstance = vi.mocked(customInstance);

beforeEach(() => {
  mockedCustomInstance.mockReset();
  mockedCustomInstance.mockResolvedValue(envelope);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSession', () => {
  it('compartilha uma única requisição quando chamado de forma concorrente', async () => {
    const [first, second] = await Promise.all([fetchSession(), fetchSession()]);

    expect(mockedCustomInstance).toHaveBeenCalledTimes(1);
    expect(first).toEqual(envelope.data);
    expect(second).toEqual(envelope.data);
  });

  it('dispara uma nova requisição após a anterior ser resolvida', async () => {
    await fetchSession();
    await fetchSession();

    expect(mockedCustomInstance).toHaveBeenCalledTimes(2);
  });
});
