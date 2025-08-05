// eslint-disable-next-line @typescript-eslint/no-var-requires
const { z } = require('zod');

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),  
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url(),
  AWS_ACCESS_KEY: z.string(),
  AWS_SECRET_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_BUCKET_NAME: z.string(),
  MERCADO_PAGO_SAMPLE_ACCESS_TOKEN:z.string(),
  NEXT_PUBLIC_MERCADO_PAGO_SAMPLE_PUBLIC_KEY: z.string() 
});
const env = envSchema.safeParse(process.env);

const formatErrors = (
  /** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
  errors,
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && '_errors' in value)
        return `${name}: ${value._errors.join(', ')}\n`;
    })
    .filter(Boolean);

if (!env.success) {
  console.error(process.env.NODE_ENV);
  console.error(
    '❌ Invalid environment variables:\n',
    ...formatErrors(env.error.format()),
  );
  process.exit(1);
}

module.exports.env = env.data;