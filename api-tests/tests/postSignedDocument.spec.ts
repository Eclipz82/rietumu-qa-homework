import { test, expect, APIRequestContext } from '@playwright/test';
import {
  CERT, ACTIVE_TICKET, INACTIVE_TICKET, callElinkPro, registerPayment, Params,
} from '../helpers/elinkPRO';
import { signXml } from '../helpers/xmlSign';

test.use({ clientCertificates: [CERT] });

// Возвращает XML, который банк ожидает на подпись
async function getDocForSign(request: APIRequestContext, refNo: string): Promise<string> {
  const { body } = await callElinkPro(request, {
    function: 'GetDocumentForSign',
    ticket: ACTIVE_TICKET,
    language: 'EN',
    refNo,
  });
  return body.doc;
}

const validParams = (refNo: string, doc: string, overrides: Params = {}): Params => ({
  function: 'PostSignedDocument',
  ticket: ACTIVE_TICKET,
  language: 'EN',
  refNo,
  doc,
  ...overrides,
});

test.describe('ELink PRO: PostSignedDocument', () => {
  test('Signed document bank accept', async ({ request }) => { //подписанный документ принимается банком
    const refNo = await registerPayment(request);
    const signed = signXml(await getDocForSign(request, refNo), CERT.pfxPath, CERT.passphrase);

    const { status, body } = await callElinkPro(request, validParams(refNo, signed));
    console.log(JSON.stringify(body, null, 2)); // на время разведки

    expect(status).toBe(200);
    expect(body.code).toBe(0);
    expect(body.error_code).toBe('IERR_OK');
    expect(body.error_level).toBe(0);
    expect(body.refNo.trim()).toBe(refNo);
  });

test('Document without sign is diclined', async ({ request }) => { //документ без подписи отклоняется
  const refNo = await registerPayment(request);
  const unsigned = await getDocForSign(request, refNo);

  const { body } = await callElinkPro(request, validParams(refNo, unsigned));

  expect(body.code).toBe(4);
  expect(body.error).toBe('doc');
});

  test('Document which chenged after signing, is declined', async ({ request }) => { // документ, изменённый после подписи, отклоняется
    const refNo = await registerPayment(request);
    const signed = signXml(await getDocForSign(request, refNo), CERT.pfxPath, CERT.passphrase);
    const tampered = signed.replace('<Amount>100.00</Amount>', '<Amount>999.00</Amount>');
    expect(tampered).not.toBe(signed); // защита от «пустой» подмены

    const { body } = await callElinkPro(request, validParams(refNo, tampered));
    console.log(JSON.stringify(body, null, 2));

    expect(body.error_level).toBe(4);
    expect(body.error_code).toBe('IERR_SIG_BAD');
  });

  test('Without refNo returns code 4', async ({ request }) => { //без refNo возвращается code 4
    const { body } = await callElinkPro(request, validParams('', '<RBdocument/>', { refNo: undefined }));

    expect(body.code).toBe(4);
  });

  test('Without doc returns code 4', async ({ request }) => { //без doc возвращается code 4
    const refNo = await registerPayment(request);

    const { body } = await callElinkPro(request, validParams(refNo, '', { doc: undefined }));

    expect(body.code).toBe(4);
  });

  test('Inactive ticket returns code 6', async ({ request }) => { //неактивный ticket возвращает code 6
    const refNo = await registerPayment(request);
    const signed = signXml(await getDocForSign(request, refNo), CERT.pfxPath, CERT.passphrase);

    const { body } = await callElinkPro(
      request,
      validParams(refNo, signed, { ticket: INACTIVE_TICKET }),
    );

    expect(body.code).toBe(6);
  });
});