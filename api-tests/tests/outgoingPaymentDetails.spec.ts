import { test, expect } from '@playwright/test';
import { AUTH, RID, ACTIVE_TICKET, INACTIVE_TICKET, callElink, Params, REFNO } from '../helpers/elink';


const validParams = (overrides: Params = {}): Params => ({
  function: 'OutgoingPaymentDetails',
  rid: RID,
  ticket: ACTIVE_TICKET,
  refno: REFNO,
  language: 'EN',
  ...overrides,
});

test.use({ httpCredentials: AUTH });

test.describe('ELink: OutgoingPaymentDetails', () => {
  test('Successful request returns payment details', async ({ request }) => { //успешный запрос возвращает детали платежа
    const { status, body } = await callElink(request, validParams());

    expect(status).toBe(200);
    expect(body.code).toBe(0);
    expect(body.error).toBe('');
    expect(body.details).toBeDefined();
    expect(body.details.ref_no).toBe(REFNO);
  });

  test('Payment details have expected fields ', async ({ request }) => { //детали содержат ожидаемые поля
    const { body } = await callElink(request, validParams());
    const details = body.details;

    expect(typeof details.ref_no).toBe('string');
    expect(details.reg_date).toMatch(/^\d{4}-\d{2}-\d{2}T/); //reg_date должен соответствовать формату даты 
    expect(typeof details.rem_name).toBe('string');
    expect(typeof details.rem_acc).toBe('string');
    expect(typeof details.pmnt_amount).toBe('number');
    expect(details.pmnt_ccy).toMatch(/^[A-Z]{3}$/);    // pmnt_ccy должен быть трёхбуквенным кодом валюты в верхнем регистре
    expect(typeof details.bbank_name).toBe('string');
  });

  test('The details match the transaction from the Transactions section.', async ({ request }) => { //детали совпадают с транзакцией из Transactions
    const Transactions = await callElink(request, {
      function: 'Transactions',
      rid: RID,
      ticket: ACTIVE_TICKET,
      ccy: 'EUR',
      dateFrom: '2015-06-01',
      dateTill: '2015-06-30',
    });
    const payment = Transactions.body.transactions.find(
      (t: any) => t.refno === REFNO && t.trndesc === 'External payment',
    );
    expect(payment, 'The payment with the required refno must be present in Transactions.').toBeDefined(); //платёж с нужным refno должен быть в Transactions

    const { body } = await callElink(request, validParams());

    // в Transactions расход отрицательный, в деталях — положительный
    expect(body.details.pmnt_amount).toBe(Math.abs(payment.amount));
    expect(body.details.pmnt_ccy).toBe(payment.currency);
    expect(body.details.bbank_name).toBe(payment.benbank);
  });

  test('Without refno API returns error', async ({ request }) => { //без refno API возвращает ошибку
    const { status, body } = await callElink(request, validParams({ refno: undefined }));

    expect(status).toBe(200); // ошибки API приходят с HTTP 200
    expect(body.code).toBe(4);
    expect(body.error).toBe('refno');
  });

  test('Not existed refno returns error', async ({ request }) => { //несуществующий refno возвращает ошибку
    const { body } = await callElink(request, validParams({ refno: 'NOSUCHREFNO000' }));

    expect(body.code).not.toBe(0);
    expect(body.details).toBeUndefined();
  });

  test('Inactive ticket returns error', async ({ request }) => { //неактивный ticket возвращает ошибку
    const { body } = await callElink(request, validParams({ ticket: INACTIVE_TICKET }));

    expect(body.code).not.toBe(0);
    expect(body.details).toBeUndefined();
  });
});