import type { User } from '@supabase/supabase-js';
import isbot from 'isbot';
import type { IHistory, IHistoryDTO } from './table.server';

export async function getUserFromCookie(_cookie: string): Promise<User | undefined> {
  return undefined;
}

export async function authenticate(
  request: Request,
  _customAuthRequired?: boolean,
  botcheckRequired?: boolean,
  _payloadCheckRequired?: boolean,
  _headers = new Headers(),
): Promise<User | undefined> {
  const check = isbot.spawn();
  check.exclude(['Checkly', 'chrome-lighthouse', 'googlebot', 'bingbot', 'discordbot', 'twitterbot', 'vercel']);
  if (botcheckRequired && check(request.headers.get('User-Agent'))) {
    throw new Response('Forbidden', { status: 403 });
  }
  return undefined;
}

export async function insertHistory(_history: IHistoryDTO) {
  return { data: null as IHistory[] | null, error: new Error('Account history is disabled in guest mode') };
}
export async function getHistory(_userId: string, _types: string | null, _from: string | null, _to: string | null, _page = 1): Promise<IHistory[]> {
  return [];
}
export async function getCountHistory(_userId: string, _types: string | null, _from: string | null, _to: string | null): Promise<number> {
  return 0;
}
