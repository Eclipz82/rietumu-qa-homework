import { test, expect } from '@playwright/test';
import { LoanCalculatePage } from '../pages/loanCalculatorPage';

test.describe('Loan Calculate tests', () => {

 test('Navigate to Mortgage in Latvia from homepage', async ({ page }) => {
  await page.goto('https://www.rietumu.com/en');
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
   await loanCalculatePage.radioEqual.check();
   await expect(loanCalculatePage.radioEqual).toBeChecked();
  await expect(loanCalculatePage.radioVariable).not.toBeChecked();
      
  
  });
  test('Switching Variable <-> Equal recalculates repayment', async ({ page }) => {
  const calc = new LoanCalculatePage(page);
  await calc.goto();
  await calc.acceptCookies();

  // Variable (по умолчанию) -> первый платёж 1944.44
  await calc.fillCalculator({ amount: '200000', years: '15', months: '0', rate: '5', type: 'Variable' });
  await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1944.44, 1);

  // переключаем на Equal -> 1581.59
  await calc.radioEqual.click();
  await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1581.59, 1);

  // и обратно на Variable -> снова 1944.44
  await calc.radioVariable.click();
  await expect.poll(() => calc.getMonthlyRepayment()).toBeCloseTo(1944.44, 1);
});


  test('Repayment schedule opens', async ({ page }) => {
   const loanCalculatePage = new LoanCalculatePage(page);
   await loanCalculatePage.goto();
   await loanCalculatePage.acceptCookies(); 
   await loanCalculatePage.fieldBorrow.fill(('200000'));
  await loanCalculatePage.annualInterestRate.click();
  await loanCalculatePage.annualInterestRate.fill('');
  await loanCalculatePage.annualInterestRate.pressSequentially('5');
  await loanCalculatePage.annualInterestRate.press('Tab');

  await expect(loanCalculatePage.buttonShowTable).toBeVisible();
  await loanCalculatePage.buttonShowTable.click();
  await expect(loanCalculatePage.scheduleTable).toBeVisible(); 

   
  
  });

const cases = [
  { amount: '200000', years: '15', months: '0', rate: '5', type: 'Equal',    expected: 1581.59 },
  { amount: '200000', years: '10', months: '6', rate: '5', type: 'Equal',    expected: 2043.49 },
  { amount: '200000', years: '15', months: '0', rate: '5', type: 'Variable', expected: 1944.44 },
];

for (const c of cases) {
  test(`Monthly repayment: ${c.type} ${c.amount}/${c.years}y${c.months}m/${c.rate}%`, async ({ page }) => {
    const calc = new LoanCalculatePage(page);
    await calc.goto();
    await calc.acceptCookies();
    await calc.fillCalculator(c);            // вынесите в POM
    const actual = await calc.getMonthlyRepayment(); // парсинг числа из текста
    expect(actual).toBeCloseTo(c.expected, 1);
  });
}
  
 
  });

