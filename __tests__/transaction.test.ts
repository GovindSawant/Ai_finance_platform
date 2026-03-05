
import { calculateNextRecurringDate } from '@/lib/date-utils';

describe('calculateNextRecurringDate', () => {
    it('should add 1 day for DAILY interval', () => {
        const start = new Date('2023-01-01');
        const next = calculateNextRecurringDate(start, 'DAILY');
        expect(next.toISOString().split('T')[0]).toBe('2023-01-02');
    });

    it('should add 7 days for WEEKLY interval', () => {
        const start = new Date('2023-01-01');
        const next = calculateNextRecurringDate(start, 'WEEKLY');
        expect(next.toISOString().split('T')[0]).toBe('2023-01-08');
    });

    it('should add 1 month for MONTHLY interval', () => {
        const start = new Date('2023-01-01');
        const next = calculateNextRecurringDate(start, 'MONTHLY');
        expect(next.toISOString().split('T')[0]).toBe('2023-02-01');
    });

    it('should add 1 year for YEARLY interval', () => {
        const start = new Date('2023-01-01');
        const next = calculateNextRecurringDate(start, 'YEARLY');
        expect(next.toISOString().split('T')[0]).toBe('2024-01-01');
    });

    it('should handle leap years correctly', () => {
        const start = new Date('2024-02-29'); // Leap year
        const next = calculateNextRecurringDate(start, 'YEARLY');
        // 2025 is not leap year, checks Feb 28 usually or March 1? 
        // Javascript Date setFullYear keeps month, if day is invalid (29 Feb -> 28 Feb or 1 Mar depending on impl, usually March 1)
        // Actually setFullYear(2025) on Feb 29 yields March 1, 2025
        expect(next.toISOString().split('T')[0]).toBe('2025-03-01');
    });
});
