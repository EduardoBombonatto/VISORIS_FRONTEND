'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchSession } from '../api/session';
import { useAuthStore } from '@/store/auth-store';
import { clearSessionCookie } from '@/lib/session-cookie';

export default function SessionRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || user) return;
    attempted.current = true;

    fetchSession()
      .then((envelope) => {
        const { user: restoredUser } = envelope.data;
        setSession(restoredUser);

        if (pathname === '/' || pathname === '/auth') {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        clearSessionCookie();
      });
  }, [user, pathname, router, setSession]);

  return null;
}
