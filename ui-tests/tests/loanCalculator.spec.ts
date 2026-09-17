import { test, expect } from '@playwright/test';
import { LoanCalculatePage } from '../pages/loanCalculatorPage';

test.describe('Loan Calculate tests', () => {

  test('Loan Calculate page UI elements visible', async ({ page }) => {
   const loanCalculatePage = new LoanCalculatePage(page);
   await loanCalculatePage.goto();
    await loanCalculatePage.acceptCookies(); // если баннер куки перекрывает элементы

    await expect(loanCalculatePage.fieldBorrow).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodYear).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodMonths).toBeVisible();
    await expect(loanCalculatePage.annualInterestRate).toBeVisible();
    await expect(loanCalculatePage.buttonShowTable).toBeVisible();

  
  });

  });