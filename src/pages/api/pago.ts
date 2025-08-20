import { type NextApiRequest, type NextApiResponse } from 'next';
import mercadopago from 'mercadopago';
import { env } from 'server/env';
import { paymentSchema } from '../../utils/auth';

// Configuración de MercadoPago
const mercadoPagoAccessToken = env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN;
mercadopago.configurations.setAccessToken(mercadoPagoAccessToken);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!mercadoPagoAccessToken) {
    return res.status(500).json({ error: 'Access token not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.errors });
  }

  const paymentPayload = {
    transaction_amount: parsed.data.transactionAmount,
    token: parsed.data.token,
    description: parsed.data.description,
    installments: parsed.data.installments,
    payment_method_id: parsed.data.payment_method_id,
    issuer_id: parsed.data.issuer_id,
    payer: {
      email: parsed.data.payer.email,
      identification: {
        type: parsed.data.payer.identification.type,
        number: parsed.data.payer.identification.number,
      },
    },
  };

  try {
    const response = await mercadopago.payment.save(paymentPayload);
    return res.status(201).json({ status: response.status, id: response.body.id });
  } catch (error) {
    console.error('MercadoPago error', error);
    return res.status(500).json({ error: 'Error procesando el pago' });
  }
}
