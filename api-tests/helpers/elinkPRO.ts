import { APIRequestContext } from '@playwright/test';
import { ACTIVE_TICKET } from './elink';


export { ACTIVE_TICKET, INACTIVE_TICKET } from './elink';

const ORIGIN_PRO = 'https://test-elinkpro.rietumu.lv';
export const ENDPOINT_PRO = `${ORIGIN_PRO}/TCatBox/elinkpro/Process`;

export const CERT = {
  origin: ORIGIN_PRO,
  pfxPath: './certs/068774.p12',
  passphrase: '12345678',
};


// Набор параметров запроса: имя → значение.
// undefined позволяет «убрать» параметр в тесте (проверка «без ticket», «без doc»).
export type Params = Record<string, string | undefined>;

// Отправляет POST в E-Link PRO и возвращает HTTP-статус и тело ответа.
// Общая для GetDocumentForSign, PostDocument и PostSignedDocument.
export async function callElinkPro(request: APIRequestContext, params: Params) {

  // Убираем параметры со значением undefined, чтобы они не уходили на сервер
  const form = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  ) as Record<string, string>;

  const res = await request.post(ENDPOINT_PRO, { form });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = { __raw: text }; // не JSON — пригодится при отладке
  }
  return { status: res.status(), body };
}


// ---------- Платёжный документ (XML) ----------

// Поля платежа, которые можно менять в тестах. Все необязательные:
// что не указано, берётся значение по умолчанию из buildPaymentXml.
interface PaymentFields {
  Amount?: string;
  Ccy?: string;
  SenderAcc?: string;
  BenAcc?: string;
  BenAddr1?: string;
  BenCountry?: string;
  BenBankAddr1?: string;
  BenBankCountry?: string;
  Details70?: string;
  Charge?: string;
  Urgency?: string;
}

// XML платежа по образцу из документации; аргументом меняем нужные поля
export function buildPaymentXml(o: PaymentFields = {}): string {
  const f = {
    Amount: '100.00',
    Ccy: 'EUR',
    SenderAcc: 'LV10RTMB0000000000000',
    BenAcc: 'CH0000000000000000000',
    BenAddr1: 'TEST COMPANY LIMITED',
    BenCountry: 'CH',
    BenBankAddr1: 'AXION SWISS BANK SA',
    BenBankCountry: 'CH',
    Details70: 'payment details',
    Charge: 'OUR',
    Urgency: '1',
    ...o, // Значения по умолчанию; ...o в конце перезаписывает их переданными полями
  };

  return `<RBdocument type="payment">
  <DocNo>1-3</DocNo>
  <SendCopyeMail/>
  <SendCopyiRietumu>N</SendCopyiRietumu>
  <User>068774</User>
  <System></System>
  <AddInfo72>additional info</AddInfo72>
  <AmkCode>0</AmkCode>
  <Amount>${f.Amount}</Amount>
  <BenBank>
    <BenBankAcc>A111111</BenBankAcc>
    <BenBankAddr1>${f.BenBankAddr1}</BenBankAddr1>
    <BenBankAddr2>LUGANO</BenBankAddr2>
    <BenBankAddr3>1, VIA BOSSI</BenBankAddr3>
    <BenBankBic>UNCECH22XXX</BenBankBic>
    <BenBankCountry>${f.BenBankCountry}</BenBankCountry>
    <BenBankEl/>
    <BenBankElType/>
  </BenBank>
  <Beneficiary>
    <BenAcc>${f.BenAcc}</BenAcc>
    <BenAddr1>${f.BenAddr1}</BenAddr1>
    <BenAddr2>address line 1</BenAddr2>
    <BenAddr3>address line 2</BenAddr3>
    <BenCountry>${f.BenCountry}</BenCountry>
    <BenID>1234567</BenID>
  </Beneficiary>
  <Ccy>${f.Ccy}</Ccy>
  <Charge>${f.Charge}</Charge>
  <Details70>${f.Details70}</Details70>
  <Intermediary>
    <IntBankAcc/>
    <IntBankAddr1>ASIA PACIFIC FINANCIAL SERVICES CHI</IntBankAddr1>
    <IntBankAddr2>NA LIMITED</IntBankAddr2>
    <IntBankAddr3>LANZHOU GANSU</IntBankAddr3>
    <IntBankBic>APFVCNB1XXX</IntBankBic>
    <IntBankCountry>CN</IntBankCountry>
    <IntBankEl/>
    <IntBankElType/>
  </Intermediary>
  <Rate>0.0</Rate>
  <Sender>
    <SenderAcc>${f.SenderAcc}</SenderAcc>
    <SenderCountry/>
  </Sender>
  <Urgency>${f.Urgency}</Urgency>
</RBdocument>`;
}

// Регистрирует тестовый платёж через PostDocument и возвращает его refNo
// GetDocumentForSign и PostSignedDocument работают только с уже зарегистрированным
// документом, поэтому их тесты сначала вызывают эту функцию.
// overrides позволяет изменить поля платежа, например registerPayment(request, { Amount: '123.45' }).
export async function registerPayment(
  request: APIRequestContext,
  overrides: PaymentFields = {},
): Promise<string> {
  const { body } = await callElinkPro(request, {
    function: 'PostDocument',
    ticket: ACTIVE_TICKET,
    language: 'EN',
    doc: buildPaymentXml(overrides),
  });


  // Если refNo не пришёл, дальше тест бессмысленен: падаем сразу
  // и показываем ответ сервера, чтобы было видно причину
  if (!body.refNo) {
    throw new Error(`PostDocument не вернул refNo: ${JSON.stringify(body)}`);
  }
  return body.refNo;
}
