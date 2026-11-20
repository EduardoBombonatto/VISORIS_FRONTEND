'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { AppointmentForm } from './AppointmentForm';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (scheduledDate?: string) => void;
  initialDate?: string;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}: AppointmentModalProps) {
  return (
    <Modal open={isOpen} title="Novo Agendamento" onClose={onClose}>
      <AppointmentForm
        onSuccess={onSuccess || onClose}
        onCancel={onClose}
        initialDate={initialDate}
      />
    </Modal>
  );
}
