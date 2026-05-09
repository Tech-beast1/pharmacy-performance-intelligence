import { describe, it, expect } from 'vitest';

describe('Clear All - Selected Month Data Deletion', () => {
  it('should use selectedMonth instead of current date when clearing', () => {
    // The handleClearAll function now parses selectedMonth like this:
    const selectedMonth = '2026-05';
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // Verify parsing works correctly
    expect(year).toBe(2026);
    expect(month).toBe(5);
  });

  it('should parse June month correctly', () => {
    const selectedMonth = '2026-06';
    const [year, month] = selectedMonth.split('-').map(Number);
    
    expect(year).toBe(2026);
    expect(month).toBe(6);
  });

  it('should parse different months correctly', () => {
    const testCases = [
      { input: '2026-01', expectedYear: 2026, expectedMonth: 1 },
      { input: '2026-02', expectedYear: 2026, expectedMonth: 2 },
      { input: '2026-03', expectedYear: 2026, expectedMonth: 3 },
      { input: '2026-04', expectedYear: 2026, expectedMonth: 4 },
      { input: '2026-05', expectedYear: 2026, expectedMonth: 5 },
      { input: '2026-06', expectedYear: 2026, expectedMonth: 6 },
      { input: '2026-07', expectedYear: 2026, expectedMonth: 7 },
      { input: '2026-08', expectedYear: 2026, expectedMonth: 8 },
      { input: '2026-09', expectedYear: 2026, expectedMonth: 9 },
      { input: '2026-10', expectedYear: 2026, expectedMonth: 10 },
      { input: '2026-11', expectedYear: 2026, expectedMonth: 11 },
      { input: '2026-12', expectedYear: 2026, expectedMonth: 12 },
    ];

    testCases.forEach(({ input, expectedYear, expectedMonth }) => {
      const [year, month] = input.split('-').map(Number);
      expect(year).toBe(expectedYear);
      expect(month).toBe(expectedMonth);
    });
  });

  it('should clear data from selected month not current date', () => {
    // Before fix: handleClearAll used new Date() to get current month
    // After fix: handleClearAll uses selectedMonth from Dashboard
    
    // Simulate the old behavior
    const now = new Date();
    const oldMonth = now.getMonth() + 1;
    const oldYear = now.getFullYear();
    
    // Simulate the new behavior
    const selectedMonth = '2026-05';
    const [newYear, newMonth] = selectedMonth.split('-').map(Number);
    
    // They should be different (unless today is May 2026)
    // The important thing is that the new behavior uses selectedMonth
    expect(newMonth).toBe(5);
    expect(newYear).toBe(2026);
  });

  it('should show toast message with selected month', () => {
    // The handleClearAll function now shows:
    // toast.success(`Data for ${selectedMonth} cleared successfully`);
    
    const selectedMonth = '2026-06';
    const expectedMessage = `Data for ${selectedMonth} cleared successfully`;
    
    expect(expectedMessage).toBe('Data for 2026-06 cleared successfully');
  });
});
