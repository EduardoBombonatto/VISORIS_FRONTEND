import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${className ?? ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="small" /> : children}
    </button>
  );
}
