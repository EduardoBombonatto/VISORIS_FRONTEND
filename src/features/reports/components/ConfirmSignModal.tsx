'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { ConfirmSignModalProps } from '../types';
import styles from './ConfirmSignModal.module.css';

const CHECKLIST_ITEMS = [
  'Paciente, tutor e exame estão identificados corretamente?',
  'A data corresponde ao atendimento?',
  'A técnica está registrada?',
  'Os achados estão organizados e legíveis?',
  'A conclusão está coerente com o que foi descrito?',
  'As imagens pertencem ao caso correto?',
  'O responsável e a assinatura estão identificados?',
  'O arquivo final é a versão que deve ser enviada?',
];

export default function ConfirmSignModal({
  isOpen,
  isSigning = false,
  patientName,
  onConfirm,
  onCancel,
}: ConfirmSignModalProps) {
  const [checkedIndices, setCheckedIndices] = useState<number[]>(() =>
    CHECKLIST_ITEMS.map((_, i) => i),
  );

  const toggleItem = (index: number) => {
    setCheckedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <Modal
      open={isOpen}
      size="lg"
      title="Finalizar e Assinar Laudo"
      onClose={() => {
        if (!isSigning) onCancel();
      }}
    >
      <div className={styles.modalBody}>
        <p className={styles.description}>
          Confirma a finalização e assinatura oficial do laudo
          {patientName ? (
            <>
              {' '}
              do paciente <strong>{patientName}</strong>
            </>
          ) : null}
          ?
        </p>

        {/* Checklist antes de finalizar */}
        <div className={styles.checklistCard}>
          <div className={styles.checklistHeader}>
            <span className={styles.checklistIcon}>📋</span>
            <strong className={styles.checklistTitle}>Checklist antes de finalizar</strong>
          </div>
          <ul className={styles.checklistList}>
            {CHECKLIST_ITEMS.map((item, idx) => {
              const isChecked = checkedIndices.includes(idx);
              return (
                <li key={item} className={styles.checklistItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(idx)}
                      disabled={isSigning}
                      className={styles.checkboxInput}
                    />
                    <span className={isChecked ? styles.itemChecked : ''}>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <p className={styles.warningNote}>
          Após a assinatura, o laudo receberá o carimbo oficial de data e hora, tornará-se imutável
          (somente leitura) e o status na Agenda Diária será atualizado para{' '}
          <strong>Laudo Concluído</strong>.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={isSigning}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnConfirmSign}
            onClick={onConfirm}
            disabled={isSigning}
          >
            {isSigning ? 'Assinando...' : 'Confirmar e Assinar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
