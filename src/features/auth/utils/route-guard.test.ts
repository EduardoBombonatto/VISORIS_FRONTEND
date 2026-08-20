import { describe, expect, it } from 'vitest';
import { resolvePostAuthRoute } from './route-guard';

describe('resolvePostAuthRoute', () => {
  it('/dashboard renderiza', () => {
    expect(resolvePostAuthRoute({ pathname: '/dashboard' })).toEqual({ type: 'render' });
  });

  it('demais rotas redirecionam para /dashboard', () => {
    expect(resolvePostAuthRoute({ pathname: '/' })).toEqual({ type: 'redirect', to: '/dashboard' });
    expect(resolvePostAuthRoute({ pathname: '/auth' })).toEqual({
      type: 'redirect',
      to: '/dashboard',
    });
  });
});
