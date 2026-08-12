import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={styles.checkbox}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
