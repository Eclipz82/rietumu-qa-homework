import { test, expect } from '@playwright/test';
import { LoanCalculatePage } from '../pages/loanCalculatorPage';

test.describe('Loan Calculate tests', () => {

  test('Loan Calculate page UI elements visible', async ({ page }) => {
   const loanCalculatePage = new LoanCalculatePage(page);
   await loanCalculatePage.goto();
    await loanCalculatePage.acceptCookies(); 

    await expect(loanCalculatePage.fieldBorrow).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodYear).toBeVisible();
    await expect(loanCalculatePage.fieldPeriodMonths).toBeVisible();
    await expect(loanCalculatePage.annualInterestRate).toBeVisible();
      
  
  });


  test('Repayment schedule opens', async ({ page }) => {
   const loanCalculatePage = new LoanCalculatePage(page);
   await loanCalculatePage.goto();
   await loanCalculatePage.acceptCookies(); 
   await loanCalculatePage.fieldBorrow.fill(('100000'));
   await loanCalculatePage.fieldBorrow.blur()
   await loanCalculatePage.annualInterestRate.fill(('12332'));
   await loanCalculatePage.buttonShowTable.click();
   await expect(loanCalculatePage.scheduleTable).toBeVisible();  

   
  
  });
 
  })
  ;

