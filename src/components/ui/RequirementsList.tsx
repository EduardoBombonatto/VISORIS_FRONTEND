import styles from './RequirementsList.module.css';

export interface RequirementItem {
  label: string;
  met: boolean;
}

interface RequirementsListProps {
  items: RequirementItem[];
}

const RequirementsList = ({ items }: RequirementsListProps) => {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li
          key={item.label}
          className={styles.item}
          data-met={item.met}
          aria-label={item.met ? `${item.label}: atendido` : `${item.label}: não atendido`}
        >
          <span className={styles.marker} aria-hidden="true">
            {item.met ? '✓' : '✗'}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
};

export default RequirementsList;
