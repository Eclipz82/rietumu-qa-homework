import { Page, Locator , expect} from '@playwright/test';

export class LoanCalculatePage {
  readonly page: Page;

  //Локаторы
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
  

   constructor(page: Page) {
    this.page = page;
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

  
   //Заполняет калькулятор и выбирает тип погашения
   
  async fillCalculator(params: {
    amount: string;
    years: string;
    months: string;
    rate: string;
    type: 'Variable' | 'Equal';
  }): Promise<void> {
    await this.fieldBorrow.fill(params.amount);
    await this.fieldPeriodYear.fill(params.years);
    await this.fieldPeriodMonths.fill(params.months);
    await this.annualInterestRate.fill(params.rate);
    await this.annualInterestRate.press('Tab');

    if (params.type === 'Equal') {
      await this.radioEqual.click();
    } else {
      await this.radioVariable.click();
    }
  }

  async switchToEqual(): Promise<void> {
    await this.radioEqual.click();
  }

  async switchToVariable(): Promise<void> {
    await this.radioVariable.click();
  }

  async openSchedule(): Promise<void> {
    await this.buttonShowTable.click();
    await expect(this.scheduleTable).toBeVisible();
  }

  //Возвращает числовое значение Monthly Repayment
   
  async getMonthlyRepayment(): Promise<number> {
    await expect(this.monthlyRepayment).toContainText(/\d+[\.,]\d{2}/);  // Ждём появления текста в формате числа с 2 знаками после запятой/точки

    const text = (await this.monthlyRepayment.innerText())
      .replace(/\s/g, '')  // убираем все пробелы из текста
      .replace(',', '.');  // заменяем запятую на точку (унификация разделителя)

    const match = text.match(/(\d+\.\d+)/); // ищем число с плавающей точкой в строке
    if (!match) {
      throw new Error(`No number found in Monthly Repayment: "${text}"`);
    }

    return parseFloat(match[1]);
  }
}