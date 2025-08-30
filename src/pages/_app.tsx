import '../styles/global.css';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppType } from 'next/app';
import { trpc } from 'utils/trpc';

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps,
}) => {
  return (
    <SessionProvider
      session={pageProps.session}
      // Configuraciones para evitar bucles
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
