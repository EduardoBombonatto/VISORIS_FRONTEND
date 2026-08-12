import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium';
}

export default function Spinner({ size = 'medium' }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${size === 'small' ? styles.small : styles.medium}`}
      role="status"
      aria-label="Carregando"
    />
  );
}
