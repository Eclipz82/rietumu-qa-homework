import { APIRequestContext } from '@playwright/test';
import { env } from './env';

// ---------- Константы песочницы E-Link (из описания в задании) ----------

export const ENDPOINT = env('ELINK_URL'); // Адрес API E-Link (JSON-версия)
export const RID = env('ELINK_RID'); // Rietumu ID клиента; обязательный параметр в запросах E-Link

export const ACTIVE_TICKET = env('ELINK_ACTIVE_TICKET'); // Электронный пропуск (ticket): активный, с ним запросы проходят успешно
export const INACTIVE_TICKET = env('ELINK_INACTIVE_TICKET'); // Неактивный ticket: нужен для негативных тестов (ожидаем ошибку)
export const REFNO = 'HVEF06159900001'; // Референс платежа из ответа Transactions; нужен для OutgoingPaymentDetails
export const AUTH = {
  username: env('ELINK_LOGIN'),
  password: env('ELINK_PASSWORD'),
  send: 'always' as const,
};  // Данные для Basic Auth (логин и пароль из описания песочницы). send: 'always' — отправлять заголовок Authorization сразу, а не после ответа 401.
    // as const — чтобы TypeScript считал значение литералом 'always', а не просто строкой.
// ---------- Тип параметров запроса ----------
// Набор пар «имя параметра → значение».
// Значение может быть undefined: так в тесте можно «убрать» параметр из запроса.
export type Params = Record<string, string | undefined>; 


// Отправляет POST-запрос в E-Link и возвращает HTTP-статус и тело ответа (JSON).
// Используется всеми тестами E-Link, поэтому URL и разбор ответа не дублируются.
export async function callElink(request: APIRequestContext, params: Params) {

    // Убираем параметры со значением undefined, чтобы они не уходили на сервер.
  // Так тест «без rid» просто передаёт rid: undefined.
  const form = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  ) as Record<string, string>;

  const result = await request.post(ENDPOINT, { form });    // form отправляет параметры как application/x-www-form-urlencoded (формат, который ждёт E-Link)
  return { status: result.status(), body: await result.json() };   // Возвращаем статус отдельно от тела: ошибки API приходят с HTTP 200,
  // поэтому в тестах нужно проверять и статус, и поле code в теле
}







