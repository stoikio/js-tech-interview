import { vi } from 'vitest';

export type Reply = { status: number; body?: unknown };

export const ok = (body: unknown): Reply => ({ status: 200, body });
export const noContent = (): Reply => ({ status: 204 });
export const failure = (status: number, message: string, code?: string): Reply => ({
  status,
  body: { message, code },
});

type Handler = (body: unknown) => Reply | Promise<Reply>;
type Call = { method: string; path: string; body: unknown };

/**
 * Replaces `fetch` with an API kept in memory, so tests cross the same seam as the app: lib/api.ts.
 * A route is `"METHOD /path"` without the `/api` prefix. A handler may return a promise, to choose
 * when a response arrives.
 */
export function fakeApi(routes: Record<string, Handler>) {
  const calls: Call[] = [];

  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const path = input.replace(/^\/api/, '');
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body });

    const handler = routes[`${method} ${path}`];
    if (!handler) throw new Error(`No fake route for ${method} ${path}`);
    const reply = await handler(body);
    return new Response(reply.status === 204 ? null : JSON.stringify(reply.body), {
      status: reply.status,
    });
  });

  return {
    calls,
    callsTo: (route: string) => calls.filter((call) => `${call.method} ${call.path}` === route),
  };
}
