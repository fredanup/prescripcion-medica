import type { TRPCLink } from '@trpc/client';
import {
  httpBatchLink,
  loggerLink,
} from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { ssrPrepass } from '@trpc/next/ssrPrepass';
import type { inferRouterOutputs } from '@trpc/server';
import type { NextPageContext } from 'next';
import getConfig from 'next/config';
import type { AppRouter } from 'server/routers/_app';
import superjson from 'superjson';

const { publicRuntimeConfig } = getConfig();
const { APP_URL } = publicRuntimeConfig;

function getEndingLink(ctx: NextPageContext | undefined): TRPCLink<AppRouter> {
  const url = typeof window === 'undefined' 
    ? `${APP_URL}/api/trpc` 
    : '/api/trpc';

  return httpBatchLink({
    transformer: superjson,
    url,
    headers() {
      if (typeof window !== 'undefined') {
        return {};
      }
      
      if (!ctx?.req?.headers) {
        return {};
      }
      
      // Server side - forward headers
      return {
        ...ctx.req.headers,
        'x-ssr': '1',
      };
    },
  });
}

export const trpc = createTRPCNext<AppRouter>({
  ssr: true,
  ssrPrepass,
  config({ ctx }) {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === 'development' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
      queryClientConfig: { 
        defaultOptions: { 
          queries: { 
            staleTime: 60,
            retry: (failureCount, error) => {
              // Type guard to check if error has 'data' property
              if (
                typeof error === 'object' &&
                error !== null &&
                'data' in error &&
                (error as any).data?.code === 'UNAUTHORIZED'
              ) {
                return false;
              }
              return failureCount < 3;
            },
          } 
        } 
      },
    };
  },
  transformer: superjson,
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;