import { test, expect } from '@playwright/test';
import {
  AUTH, ACTIVE_TICKET, INACTIVE_TICKET, callElink, Params,ENDPOINT
} from '../helpers/elink';

// Период, в который лежат тестовые данные (2015-06-15)
const validParams = (overrides: Params = {}): Params => ({
  function: 'Transactions',
  rid: '068774',
  ticket: ACTIVE_TICKET,
  ccy: 'EUR',
  dateFrom: '2015-06-01',
  dateTill: '2015-06-30',
  language: 'EN',
  ...overrides, // <- перезаписывает значения выше
});


test.use({ httpCredentials: AUTH });

test.describe('ELink: Transactions', () => {
  test('Successful request returns a list of transactions.', async ({ request }) => { //успешный запрос возвращает список транзакций
    const { status, body } = await callElink(request, validParams());

    expect(status).toBe(200);  
    expect(body.code).toBe(0);
    expect(body.error).toBe('');
    expect(body.transactions.length).toBeGreaterThan(0);
    expect(typeof body.more).toBe('boolean');
  });

  test('Transaction has expected fields', async ({ request }) => { //транзакция содержит ожидаемые поля
    const { body } = await callElink(request, validParams());

    for (const transaction of body.transactions) {
      expect(typeof transaction.uniqueID).toBe('string');
      expect(typeof transaction.trnID).toBe('string');
      expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof transaction.amount).toBe('number');
      expect(transaction.currency).toBe('EUR');
      expect(typeof transaction.saldo).toBe('number');
    }
  });


  test('Without rid API returns code 4', async ({ request }) => { //без rid API возвращает code 4
    const { status, body } = await callElink(request, validParams({ rid: undefined }));

    expect(status).toBe(200); // Bug - mistake in business logic (return statuss 200) // ошибки бизнес-логики приходят с HTTP 200
    expect(body.code).toBe(4);
    expect(body.error).toBe('rid');
  });

  test('Inactive ticket returns error', async ({ request }) => { //неактивный ticket возвращает ошибку
    const { body } = await callElink(request, validParams({ ticket: INACTIVE_TICKET }));

    expect(body.code).not.toBe(0);
    expect(body.error).toBeTruthy();
  });

  test('Incorrect format data returns error', async ({ request }) => { //неверный формат даты возвращает ошибку
    const { body } = await callElink(request, validParams({ dateFrom: '15-06-2015' }));

    expect(body.code).not.toBe(0);
  });

  test('Wrong password returns 401', async ({ playwright }) => { // неверный пароль возвращает 401
    const context = await playwright.request.newContext({
      httpCredentials: { username: '068774', password: 'wrong', send: 'always' }, // неверный пароль 'wrong'
    });
    const result = await context.post(ENDPOINT, { form: validParams() as Record<string, string> });

    expect(result.status()).toBe(401);
    await context.dispose();
  });
});