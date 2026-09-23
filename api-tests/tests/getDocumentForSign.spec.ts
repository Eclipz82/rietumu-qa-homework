import { test, expect } from '@playwright/test';
import {
  CERT, ACTIVE_TICKET, INACTIVE_TICKET, callElinkPro, registerPayment, Params,
} from '../helpers/elinkPRO';

test.use({ clientCertificates: [CERT] });

const validParams = (refNo: string, overrides: Params = {}): Params => ({
  function: 'GetDocumentForSign',
  ticket: ACTIVE_TICKET,
  language: 'EN',
  refNo,
  ...overrides,
});

test.describe('ELink PRO: GetDocumentForSign', () => {
  test('Returns registred document for the signing', async ({ request }) => { //возвращает зарегистрированный документ для подписи
    const refNo = await registerPayment(request);

    const { status, body } = await callElinkPro(request, validParams(refNo));
    

  expect(status).toBe(200);
  expect(body.code).toBe(0);
  expect(body.error).toBe('');
  expect(body.doc).toContain('<RBdocument type="payment">');
  expect(body.doc).toContain(`<RefNo>${refNo}</RefNo>`);
  expect(body.status).toBe('20');
  expect(body.state).toBe('Waiting for signature');
  expect(body.signatureRequired).toContain('CER');
  expect(body.existingSignatures).toEqual([]);
  });

  test('Document contains the data of the submitted payment', async ({ request }) => { //документ содержит данные отправленного платежа
    const refNo = await registerPayment(request, {
      Amount: '123.45',
      BenAddr1: 'ACME TEST LTD',
    });

    const { body } = await callElinkPro(request, validParams(refNo));

  expect(body.doc).toContain('<Amount>123.45</Amount>');
  expect(body.doc).toContain('<BenAddr1>ACME TEST LTD</BenAddr1>');
  expect(body.doc).toContain('<Ccy>EUR</Ccy>');
  });

  test('Without refNo returns code 4', async ({ request }) => { //без refNo возвращается code 4
    const { body } = await callElinkPro(request, validParams('', { refNo: undefined }));

    expect(body.code).toBe(4);
  });

  test('Not existed refNo returns error', async ({ request }) => { //несуществующий refNo возвращает ошибку
    const { body } = await callElinkPro(request, validParams('NOSUCHREF0000'));

    expect(body.code).not.toBe(0);
    expect(body.doc).toBeUndefined();
  });

  test('Innactive ticket returns code 6', async ({ request }) => { //неактивный ticket возвращает code 6
    const refNo = await registerPayment(request);

    const { body } = await callElinkPro(request, validParams(refNo, { ticket: INACTIVE_TICKET }));

    expect(body.code).toBe(6);
  });
});