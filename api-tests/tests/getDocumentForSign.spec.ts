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
  test('возвращает зарегистрированный документ для подписи', async ({ request }) => {
    const refNo = await registerPayment(request);

    const { status, body } = await callElinkPro(request, validParams(refNo));
    console.log(JSON.stringify(body, null, 2)); // на время разведки

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

  test('документ содержит данные отправленного платежа', async ({ request }) => {
    const refNo = await registerPayment(request, {
      Amount: '123.45',
      BenAddr1: 'ACME TEST LTD',
    });

    const { body } = await callElinkPro(request, validParams(refNo));

  expect(body.doc).toContain('<Amount>123.45</Amount>');
  expect(body.doc).toContain('<BenAddr1>ACME TEST LTD</BenAddr1>');
  expect(body.doc).toContain('<Ccy>EUR</Ccy>');
  });

  test('без refNo возвращается code 4', async ({ request }) => {
    const { body } = await callElinkPro(request, validParams('', { refNo: undefined }));

    expect(body.code).toBe(4);
  });

  test('несуществующий refNo возвращает ошибку', async ({ request }) => {
    const { body } = await callElinkPro(request, validParams('NOSUCHREF0000'));

    expect(body.code).not.toBe(0);
    expect(body.doc).toBeUndefined();
  });

  test('неактивный ticket возвращает code 6', async ({ request }) => {
    const refNo = await registerPayment(request);

    const { body } = await callElinkPro(request, validParams(refNo, { ticket: INACTIVE_TICKET }));

    expect(body.code).toBe(6);
  });
});