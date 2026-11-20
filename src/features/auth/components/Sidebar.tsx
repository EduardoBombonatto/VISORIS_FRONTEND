'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SelectAppointmentModal from '@/features/reports/components/SelectAppointmentModal';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  opensModal?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clinics', label: 'Clínicas' },
  { href: '/patients', label: 'Pacientes' },
  { href: '/reports', label: 'Laudos', opensModal: true },
  { href: '/templates', label: 'Templates' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
              {item.opensModal ? (
                <a
                  href={item.href}
                  className={`${styles.item} ${isItemActive(item.href) ? styles.active : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    setOpen(false);
                    setReportModalOpen(true);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`${styles.item} ${isItemActive(item.href) ? styles.active : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {reportModalOpen ? (
        <SelectAppointmentModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      ) : null}
    </>
  );
}
