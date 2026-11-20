import { describe, it, expect } from 'vitest';
import {
  formatCurrencyBRL,
  formatTimeHHmm,
  formatLongDate,
  formatDateToYYYYMMDD,
  getDayRangeISO,
  parseDateAndTimeToISO,
  extractAppointmentsList,
} from './formatters';

describe('Agenda formatters', () => {
  describe('formatCurrencyBRL', () => {
    it('formats numbers to Brazilian Real currency string', () => {
      const result = formatCurrencyBRL(450.5);
      expect(result).toMatch(/R\$\s*450,50/);
    });

    it('handles zero, null and undefined', () => {
      expect(formatCurrencyBRL(0)).toMatch(/R\$\s*0,00/);
      expect(formatCurrencyBRL(null)).toMatch(/R\$\s*0,00/);
      expect(formatCurrencyBRL(undefined)).toMatch(/R\$\s*0,00/);
    });
  });

  describe('formatTimeHHmm', () => {
    it('formats a date to HH:mm string', () => {
      const date = new Date(2026, 8, 16, 9, 30);
      expect(formatTimeHHmm(date)).toBe('09:30');
    });

    it('handles invalid date strings gracefully', () => {
      expect(formatTimeHHmm('invalid-date')).toBe('--:--');
    });
  });

  describe('formatLongDate', () => {
    it('formats a date to long Portuguese format with capital letter', () => {
      const date = new Date(2026, 6, 7); // July 7, 2026
      const result = formatLongDate(date);
      expect(result).toContain('7 de julho de 2026');
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
    });
  });

  describe('formatDateToYYYYMMDD', () => {
    it('formats a date to YYYY-MM-DD', () => {
      const date = new Date(2026, 8, 16);
      expect(formatDateToYYYYMMDD(date)).toBe('2026-09-16');
    });
  });

  describe('getDayRangeISO', () => {
    it('returns start and end of day in ISO format', () => {
      const date = new Date(2026, 8, 16, 12, 0, 0);
      const { startDate, endDate } = getDayRangeISO(date);
      expect(startDate).toBeDefined();
      expect(endDate).toBeDefined();
      expect(new Date(startDate).getTime()).toBeLessThan(new Date(endDate).getTime());
    });
  });

  describe('parseDateAndTimeToISO', () => {
    it('merges date and time strings into valid ISO string', () => {
      const iso = parseDateAndTimeToISO('2026-09-16', '14:30');
      const parsed = new Date(iso);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8);
      expect(parsed.getDate()).toBe(16);
      expect(parsed.getHours()).toBe(14);
      expect(parsed.getMinutes()).toBe(30);
    });
  });

  describe('extractAppointmentsList', () => {
    it('extracts appointments from double envelope response (Axios + ApiResponse)', () => {
      const mockAppointments = [{ id: 'app-1', client_name: 'John' }];
      const res = {
        data: {
          erro: false,
          data: {
            appointments: mockAppointments,
          },
        },
      };
      expect(extractAppointmentsList(res)).toEqual(mockAppointments);
    });

    it('extracts appointments from single envelope response', () => {
      const mockAppointments = [{ id: 'app-2', client_name: 'Jane' }];
      const res = {
        data: {
          appointments: mockAppointments,
        },
      };
      expect(extractAppointmentsList(res)).toEqual(mockAppointments);
    });

    it('extracts appointments from direct appointments object', () => {
      const mockAppointments = [{ id: 'app-3', client_name: 'Bob' }];
      const res = {
        appointments: mockAppointments,
      };
      expect(extractAppointmentsList(res)).toEqual(mockAppointments);
    });

    it('returns empty array for invalid, null or undefined input', () => {
      expect(extractAppointmentsList(null)).toEqual([]);
      expect(extractAppointmentsList(undefined)).toEqual([]);
      expect(extractAppointmentsList({})).toEqual([]);
      expect(extractAppointmentsList({ data: null })).toEqual([]);
      expect(extractAppointmentsList({ data: { data: null } })).toEqual([]);
    });
  });
});
