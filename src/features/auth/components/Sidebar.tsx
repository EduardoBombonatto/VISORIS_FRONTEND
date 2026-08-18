'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [{ href: '/dashboard', label: 'Dashboard' }];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-label="Menu de navegação"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav
        className={`${styles.sidebar} ${open ? styles.open : ''}`}
        aria-label="Navegação principal"
      >
        <ul className={styles.list}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.item} ${pathname === item.href ? styles.active : ''}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
