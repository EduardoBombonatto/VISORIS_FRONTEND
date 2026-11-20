import { describe, it, expect } from 'vitest';
import { createAppointmentSchema, updateAppointmentStatusSchema } from './appointment.schema';

describe('appointment.schema', () => {
  describe('createAppointmentSchema', () => {
    it('validates a correct form payload', () => {
      const validData = {
        clinic_id: 'clinic-123',
        patient_id: 'patient-456',
        scheduledDate: '2026-09-16',
        scheduledTime: '14:30',
        procedure_name: 'Endoscopia Digestiva',
        price: '450,00',
      };

      const result = createAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(450);
      }
    });

    it('handles numeric price and empty price correctly', () => {
      const resultWithNum = createAppointmentSchema.safeParse({
        clinic_id: 'c1',
        patient_id: 'p1',
        scheduledDate: '2026-09-16',
        scheduledTime: '08:00',
        procedure_name: 'Colonoscopia',
        price: 300,
      });
      expect(resultWithNum.success).toBe(true);
      if (resultWithNum.success) {
        expect(resultWithNum.data.price).toBe(300);
      }

      const resultEmpty = createAppointmentSchema.safeParse({
        clinic_id: 'c1',
        patient_id: 'p1',
        scheduledDate: '2026-09-16',
        scheduledTime: '08:00',
        procedure_name: 'Colonoscopia',
      });
      expect(resultEmpty.success).toBe(true);
      if (resultEmpty.success) {
        expect(resultEmpty.data.price).toBeUndefined();
      }
    });

    it('fails when mandatory fields are missing', () => {
      const result = createAppointmentSchema.safeParse({
        clinic_id: '',
        patient_id: '',
        scheduledDate: '',
        scheduledTime: '',
        procedure_name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.clinic_id).toBeDefined();
        expect(fieldErrors.patient_id).toBeDefined();
        expect(fieldErrors.scheduledDate).toBeDefined();
        expect(fieldErrors.scheduledTime).toBeDefined();
        expect(fieldErrors.procedure_name).toBeDefined();
      }
    });

    it('rejects negative price', () => {
      const result = createAppointmentSchema.safeParse({
        clinic_id: 'c1',
        patient_id: 'p1',
        scheduledDate: '2026-09-16',
        scheduledTime: '08:00',
        procedure_name: 'Exame',
        price: -50,
      });

      expect(result.success).toBe(false);
    });

    it('defaults payment_status to UNPAID and accepts INSURANCE', () => {
      const resultDefault = createAppointmentSchema.safeParse({
        clinic_id: 'c1',
        patient_id: 'p1',
        scheduledDate: '2026-09-16',
        scheduledTime: '08:00',
        procedure_name: 'Exame',
      });
      expect(resultDefault.success).toBe(true);
      if (resultDefault.success) {
        expect(resultDefault.data.payment_status).toBe('UNPAID');
      }

      const resultInsurance = createAppointmentSchema.safeParse({
        clinic_id: 'c1',
        patient_id: 'p1',
        scheduledDate: '2026-09-16',
        scheduledTime: '08:00',
        procedure_name: 'Exame',
        payment_status: 'INSURANCE',
      });
      expect(resultInsurance.success).toBe(true);
      if (resultInsurance.success) {
        expect(resultInsurance.data.payment_status).toBe('INSURANCE');
      }
    });
  });

  describe('updateAppointmentStatusSchema', () => {
    it('accepts valid enum status updates', () => {
      const result = updateAppointmentStatusSchema.safeParse({
        exam_status: 'IN_PROGRESS',
        report_status: 'DRAFT',
        payment_status: 'PAID',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid enum values', () => {
      const result = updateAppointmentStatusSchema.safeParse({
        exam_status: 'INVALID_STATUS',
      });

      expect(result.success).toBe(false);
    });
  });
});
