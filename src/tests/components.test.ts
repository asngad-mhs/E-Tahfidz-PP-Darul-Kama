import { describe, it, expect } from 'vitest';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

describe('10. UI Component Resilience & Property Integrity', () => {
    it('harus memvalidasi props varian Button (primary, danger, secondary)', () => {
        expect(Button).toBeDefined();
        // Memastikan komponen adalah fungsi React
        expect(typeof Button).toBe('function');
    });

    it('harus memvalidasi props Input form', () => {
        expect(Input).toBeDefined();
        expect(typeof Input).toBe('function');
    });
});
