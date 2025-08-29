// context.ts
import { getServerSession } from 'next-auth/next'; // ✅ variante Pages/Node
import type { Session } from 'next-auth';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { prisma } from './prisma';
import { s3 } from './aws/s3';
import { sendMail } from './email/mailer';
import { buildPrescriptionPdfBuffer } from './pdfs';
import { buildSessionForWs } from './session-hydration';

type HTTPOpts = CreateNextContextOptions;   // { req, res }
type WSOpts   = CreateWSSContextFnOptions;  // { req }
type CtxOpts  = HTTPOpts | WSOpts;

// 👇 Sólo considera HTTP si res.getHeader existe (NextApiResponse real)
const isHTTP = (o: CtxOpts): o is HTTPOpts =>
  'res' in o && typeof (o as any)?.res?.getHeader === 'function';

function cookies(h?: string) {
  const out: Record<string,string> = {};
  if (!h) return out;
  for (const p of h.split(';')) {
    const [k, ...r] = p.trim().split('=');
    if (k) out[k] = decodeURIComponent(r.join('=') ?? '');
  }
  return out;
}

export const createContext = async (opts: CtxOpts) => {
  let session: Session | null = null;

  try {
    if (isHTTP(opts)) {
      // ✅ Sólo aquí es seguro usar req/res
      session = await getServerSession(opts.req, opts.res, authOptions);
    } else {
      // ✅ WS: hidratar leyendo la cookie del handshake
      const ck = cookies(opts.req.headers?.cookie);
      const token =
        ck['next-auth.session-token'] || ck['__Secure-next-auth.session-token'];
      if (token) {
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: token },
          select: { userId: true, expires: true },
        });
        if (dbSession?.userId && dbSession.expires) {
          session = await buildSessionForWs(dbSession.userId, dbSession.expires);
        }
      }
    }
  } catch (e) {
    console.error('💥 createContext (WS/HTTP) failed, continuing with session=null:', e);
    session = null;
  }

  return {
    session,
    prisma,
    s3,
    mailer: { send: sendMail },
    pdfs: { prescription: buildPrescriptionPdfBuffer },
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
