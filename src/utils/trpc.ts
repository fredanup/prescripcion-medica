import { createWSClient, httpBatchLink, loggerLink, wsLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { ssrPrepass } from '@trpc/next/ssrPrepass';
import type { NextPageContext } from 'next';
import getConfig from 'next/config';
import superjson from 'superjson';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'server/routers/_app';

const { publicRuntimeConfig } = getConfig();
const { APP_URL, WS_URL } = publicRuntimeConfig;

// 👇 Singleton del WS client para evitar reconexiones por HMR/renders
declare global {
  // eslint-disable-next-line no-var
  var __TRPC_WS_CLIENT__: ReturnType<typeof createWSClient> | undefined;
}
function getWSClientSingleton() {
  if (typeof window === 'undefined') return undefined;
  if (!globalThis.__TRPC_WS_CLIENT__) {
    globalThis.__TRPC_WS_CLIENT__ = createWSClient({ url: WS_URL });
  }
  return globalThis.__TRPC_WS_CLIENT__;
}

// Deja que se infiera el tipo del link
function getEndingLink(ctx: NextPageContext | undefined) {
  if (typeof window === 'undefined') {
    return httpBatchLink({
      url: `${APP_URL}/api/trpc`,
      headers() {
        if (!ctx?.req?.headers) return {};
        return { ...ctx.req.headers, 'x-ssr': '1' };
      },
    });
  }
  const client = getWSClientSingleton()!;
  return wsLink({ client });
}

export const trpc = createTRPCNext<AppRouter>({
  ssr: true,
  ssrPrepass,
  // ✅ v10: transformer va aquí (nivel raíz del helper)
  transformer: superjson,
  config({ ctx }) {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
      queryClientConfig: {
        defaultOptions: { queries: { staleTime: 60_000 } },
      },
    };
  },
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
