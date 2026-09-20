import { Page, Locator , expect} from '@playwright/test';

export class LoanCalculatePage {
  readonly buttonAcceptAll: Locator;
  readonly fieldBorrow: Locator;
  readonly fieldPeriodYear: Locator;
  readonly fieldPeriodMonths: Locator;
  readonly annualInterestRate: Locator;
  readonly buttonShowTable: Locator;
  readonly scheduleTable: Locator;
  readonly radioVariable: Locator;
  readonly radioEqual: Locator;
  readonly monthlyRepayment: Locator;
  

   constructor(private readonly page: Page) {
    this.buttonAcceptAll = page.getByText('Accept all');
    this.fieldBorrow = page.locator('#summa');
    this.fieldPeriodYear = page.locator('#period1');

    this.fieldPeriodMonths = page.locator('#period');
    this.annualInterestRate = page.locator('#rate');
    this.buttonShowTable = page.locator('#show_table');
    this.scheduleTable = page.locator('#grafikbody');
    this.radioVariable = page.locator('input[name="type"][value="1"]');
    this.radioEqual    = page.locator('input[name="type"][value="2"]');
    this.monthlyRepayment = page.locator('table.credit_calculator tr', { hasText: 'Monthly Repayment' });
   
  }

  async goto(): Promise<void> {
    await this.page.goto(
      'https://www.rietumu.com/en/person/funding/funding-latvia'
    );
  }

  async acceptCookies(): Promise<void> {
  await this.buttonAcceptAll.click();
  }

  async fillCalculator(c: { amount: string; years: string; months: string; rate: string; type: string }) {
  await this.fieldBorrow.fill(c.amount);
  await this.fieldPeriodYear.fill(c.years);
  await this.fieldPeriodMonths.fill(c.months);
  await this.annualInterestRate.fill(c.rate);
  await this.annualInterestRate.press('Tab');
   await this.page
    .locator(`input[name="type"][value="${c.type === 'Equal' ? 2 : 1}"]`)
    .click();
}

async getMonthlyRepayment(): Promise<number> {
  await expect(this.monthlyRepayment).toContainText(/\d+\.\d{2}/);   // ждём, пока появится число
  const text = (await this.monthlyRepayment.innerText()).replace(/\s/g, '');
  const match = text.match(/\d+\.\d+/);
  if (!match) throw new Error(`No number in Monthly Repayment: "${text}"`);
  return parseFloat(match[0]);
}
}