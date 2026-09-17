import { Page, Locator } from '@playwright/test';

export class LoanCalculatePage {
    readonly buttonAcceptAll: Locator;
  readonly fieldBorrow: Locator;
  readonly fieldPeriodYear: Locator;
  readonly fieldPeriodMonths: Locator;
  readonly annualInterestRate: Locator;
  readonly buttonShowTable: Locator;
  

   constructor(private readonly page: Page) {
    this.buttonAcceptAll = page.getByText('Accept all');
    this.fieldBorrow = page.locator('#summa');
    this.fieldPeriodYear = page.locator('#period1');

    this.fieldPeriodMonths = page.locator('#period');
    this.annualInterestRate = page.locator('#rate');
    this.buttonShowTable = page.getByText('Show Detailed Repayment Schedul');
   
  }

  async goto(): Promise<void> {
    await this.page.goto(
      'https://www.rietumu.com/en/person/funding/funding-latvia'
    );
  }

  async acceptCookies(): Promise<void> {
  await this.buttonAcceptAll.click();
  }
}