import { APIRequestContext } from '@playwright/test';

export const ENDPOINT = 'https://test-elink.rietumu.lv/TCatBox/elink/process.json';
export const RID = '068774';
export const ACTIVE_TICKET = 'bbfec84137a0d763ee10a401db1ccfba8440dce7aa4f54fc606996cab28b1b62';
export const INACTIVE_TICKET = 'eeeec84137a0d763ee10a401db1ccfba8440dce7aa4f54fc606996cab28b1b62';
export const REFNO = 'HVEF06159900001'; 

export const AUTH = { username: '068774', password: '068774', send: 'always' as const };

export type Params = Record<string, string | undefined>;

export async function callElink(request: APIRequestContext, params: Params) {
  const form = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  ) as Record<string, string>;

  const result = await request.post(ENDPOINT, { form });
  return { status: result.status(), body: await result.json() };
}