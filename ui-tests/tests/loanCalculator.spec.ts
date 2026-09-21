import { test, expect } from '@playwright/test';
import { LoanCalculatePage } from '../pages/loanCalculatorPage';

test.describe('Loan Calculate tests', () => {

  test('Navigate to Mortgage in Latvia from homepage', async ({ page }) => {
    await page.goto('https://www.rietumu.com/en/');
    await page.getByText('Accept all').click();
    await page.locator('a:visible', { hasText: 'Private' }).first().click();
    await page.locator('a:visible', { hasText: 'Lending' }).first().click();
    await page.locator('a[href="/en/person/funding/funding-latvia"]:visible').click();
    await expect(page).toHaveURL(/funding-latvia/);
    await expect(new LoanCalculatePage(page).fieldBorrow).toBeVisible();
  });

  test('Loan Calculate page UI elements visible', async ({ page }) => {
    const calc = new LoanCalculatePage(page);
    await calc.goto();
    await calc.acceptCookies();

    await expect(calc.fieldBorrow).toBeVisible();
    await expect(calc.fieldPeriodYear).toBeVisible();
    await expect(calc.fieldPeriodMonths).toBeVisible();
    await expect(calc.annualInterestRate).toBeVisible();
    await expect(calc.radioEqual).toBeChecked();
    await expect(calc.radioVariable).not.toBeChecked();
  });

  test('Switching Variable <-> Equal recalculates repayment', async ({ page }) => {
    const calc = new LoanCalculatePage(page);
    await calc.goto();
    await calc.acceptCookies();

    // Variable → 1044.44
    await calc.fillCalculator({
      amount: '200000',
      years: '15',
      months: '0',
      rate: '5',
      type: 'Variable',
    });
    await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1044.44, 1);

    // Equal → 1581.59
    await calc.switchToEqual();
    await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1581.59, 1);

    // обратно на Variable → 1044.44
    await calc.switchToVariable();
    await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1044.44, 1);
  });

  test('Repayment schedule opens', async ({ page }) => {
    const calc = new LoanCalculatePage(page);
    await calc.goto();
    await calc.acceptCookies();

    await calc.fillCalculator({
      amount: '200000',
      years: '15',
      months: '0',
      rate: '5',
      type: 'Equal',
    });

    await expect(calc.buttonShowTable).toBeVisible();
    await calc.openSchedule();
  });

  const cases = [
    { amount: '200000', years: '15', months: '0', rate: '5', type: 'Equal' as const, expected: 1581.59 },
    { amount: '200000', years: '10', months: '0', rate: '5', type: 'Equal' as const, expected: 2061.40 },
    { amount: '200000', years: '15', months: '0', rate: '5', type: 'Variable' as const, expected: 1044.44 },
  ];

  for (const c of cases) {
    test(`Monthly repayment ${c.type} / ${c.amount} / ${c.years}y / ${c.months}m / ${c.rate}%`, async ({ page }) => {
      const calc = new LoanCalculatePage(page);
      await calc.goto();
      await calc.acceptCookies();

      await calc.fillCalculator(c);

      const actual = await calc.getMonthlyRepayment();
      expect(actual).toBeCloseTo(c.expected, 1);
    });
  }
});