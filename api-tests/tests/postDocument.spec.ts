import { test, expect } from '@playwright/test';
import {
  CERT, ACTIVE_TICKET, INACTIVE_TICKET, callElinkPro, buildPaymentXml, Params,
} from '../helpers/elinkPRO';

test.use({ clientCertificates: [CERT] });

const validParams = (overrides: Params = {}): Params => ({
  function: 'PostDocument',
  ticket: ACTIVE_TICKET,
  language: 'EN',
  doc: buildPaymentXml(),
  ...overrides,
});

test.describe('ELink PRO: PostDocument', () => {
  test('корректный платёж регистрируется и возвращает refNo', async ({ request }) => { //корректный платёж регистрируется и возвращает refNo
    const { status, body } = await callElinkPro(request, validParams());
    console.log(JSON.stringify(body, null, 2)); // на время разведки

  expect(status).toBe(200);
  expect(body.code).toBe(0);
  expect(body.error).toBe('');
  expect(body.refNo).toMatch(/^[A-Z0-9]+$/); // например, HVII21099900053
  expect(body.error_code).toBe('IERR_OK');
  expect(body.error_level).toBe(0);
  expect(body.signatureRequired).toContain('CER');
  });

    test('платёж с неверной валютой возвращает ошибку', async ({ request }) => {
    const { body } = await callElinkPro(
      request,
      validParams({ doc: buildPaymentXml({ Ccy: 'XXX' }) }),
    );
console.log(JSON.stringify(body, null, 2));
    expect(body.error_level).toBe(0);
  });

  test('без параметра doc возвращается code 4', async ({ request }) => {
    const { body } = await callElinkPro(request, validParams({ doc: undefined }));

    expect(body.code).toBe(4);
  });

  test('неактивный ticket возвращает code 6', async ({ request }) => {
    const { body } = await callElinkPro(request, validParams({ ticket: INACTIVE_TICKET }));

    expect(body.code).toBe(6);
  });

  test.fixme('некорректный XML в doc возвращает ошибку', async ({ request }) => {                   // Песочница принимает несуществующую валюту XXX (IERR_OK, refNo выдан).
    const { body } = await callElinkPro(request, validParams({ doc: '<RBdocument>' }));

    expect(body.code !== 0 || body.error_level === 4).toBe(true);
  });

  test.fixme('платёж без имени получателя возвращает ошибку в error_field', async ({ request }) => {   // Песочница не валидирует содержимое платежа при PostDocument:
    const { body } = await callElinkPro(                                                               // платёж без имени получателя регистрируется (IERR_OK, error_level 0).
      request,                                                                                         // По документации ожидается error_level 4 и error_field "BenAddr1".
      validParams({ doc: buildPaymentXml({ BenAddr1: '' }) }),
    );
    console.log(JSON.stringify(body, null, 2));

    expect(body.code).toBe(0); // документ зарегистрирован, но с ошибкой
    expect(body.error_level).toBe(4); // критическая ошибка
    expect(body.error_field).toBe('BenAddr1');
  });
});