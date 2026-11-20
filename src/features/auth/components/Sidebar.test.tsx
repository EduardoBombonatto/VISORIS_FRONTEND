import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    className,
    children,
    onClick,
  }: {
    href: string;
    className?: string;
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe('Sidebar', () => {
  it('renderiza o item Dashboard', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('marca o item Dashboard como ativo na rota /dashboard', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Dashboard' }).className).toContain('active');
  });

  it('renderiza o item Laudos na barra lateral', () => {
    render(<Sidebar />);
    const link = screen.getByRole('link', { name: 'Laudos' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/reports');
  });

  it('renderiza o item Templates com link correto', () => {
    render(<Sidebar />);
    const link = screen.getByRole('link', { name: 'Templates' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/templates');
  });

  it('alterna o menu com o botão hambúrguer', () => {
    render(<Sidebar />);
    const toggle = screen.getByRole('button', { name: /menu de navegação/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
