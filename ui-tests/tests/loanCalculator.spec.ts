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
    const loanCalculatePage = new LoanCalculatePage(page);
    await loanCalculatePage.goto();
    await loanCalculatePage.acceptCookies();

    await expect(loanCalculatePage.fieldBorrow).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodYear).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodMonths).toBeVisible();
    await expect(loanCalculatePage.annualInterestRate).toBeVisible();
    await expect(loanCalculatePage.radioVariable).toBeChecked();
    await expect(loanCalculatePage.radioEqual).not.toBeChecked();
  });

  test('Switching Variable <-> Equal recalculates repayment', async ({ page }) => {
    const loanCalculatePage = new LoanCalculatePage(page);
    await loanCalculatePage.goto();
    await loanCalculatePage.acceptCookies();

    // Variable → 1044.44
    await loanCalculatePage.fillCalculator({
      amount: '200000',
      years: '15',
      months: '0',
      rate: '5',
      type: 'Variable',
    });
    await expect.poll(() => loanCalculatePage.getMonthlyRepayment()).toBeCloseTo(1944.44, 1);

    // Equal → 1581.59
    await loanCalculatePage.switchToEqual();
    await expect.poll(() => loanCalculatePage.getMonthlyRepayment()).toBeCloseTo(1581.59, 1);

    // обратно на Variable → 1944.44
    await loanCalculatePage.switchToVariable();
    await expect.poll(() => loanCalculatePage.getMonthlyRepayment()).toBeCloseTo(1944.44, 1);
  });

  test('Repayment schedule opens', async ({ page }) => {
    const loanCalculatePage = new LoanCalculatePage(page);
    await loanCalculatePage.goto();
    await loanCalculatePage.acceptCookies();

    await loanCalculatePage.fillCalculator({
      amount: '200000',
      years: '15',
      months: '0',
      rate: '5',
      type: 'Equal',
    });

    await expect(loanCalculatePage.buttonShowTable).toBeVisible();
    await loanCalculatePage.openSchedule();
  });

  const cases = [
    { amount: '200000', years: '15', months: '0', rate: '5', type: 'Equal' as const, expected: 1581.59 },
    { amount: '200000', years: '10', months: '0', rate: '5', type: 'Equal' as const, expected: 2121.31 },
    { amount: '200000', years: '15', months: '0', rate: '5', type: 'Variable' as const, expected: 1944.44 },
  ];

  for (const c of cases) {
    test(`Monthly repayment ${c.type} / ${c.amount} / ${c.years}y / ${c.months}m / ${c.rate}%`, async ({ page }) => {
      const loanCalculatePage = new LoanCalculatePage(page);
      await loanCalculatePage.goto();
      await loanCalculatePage.acceptCookies();

      await loanCalculatePage.fillCalculator(c);

      const actual = await loanCalculatePage.getMonthlyRepayment();
      expect(actual).toBeCloseTo(c.expected, 1);
    });
  }
});