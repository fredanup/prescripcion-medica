// src/server/auth.ts
import { getServerSession } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from 'pages/api/auth/[...nextauth]';

export function getServerAuthSession(ctx: { req: NextApiRequest; res: NextApiResponse }) {
  return getServerSession(ctx.req, ctx.res, authOptions);
}
