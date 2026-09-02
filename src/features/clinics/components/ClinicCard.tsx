import type { ClinicData } from '@/api/index.schemas';
import styles from './ClinicCard.module.css';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue} data-field-value>
        {value || '—'}
      </span>
    </div>
  );
}

export default function ClinicCard({ clinic }: { clinic: ClinicData }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.name}>{clinic.name}</h3>
      <Field label="CNPJ" value={clinic.cnpj} />
      <Field label="Telefone" value={clinic.phone} />
      <Field label="Endereço" value={clinic.address} />
    </article>
  );
}
