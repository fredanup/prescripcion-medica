// src/server/mailer.ts
import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// helper genérico
export async function sendMail(opts: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  await mailer.sendMail({
    from: `"Sistema Médico" <${process.env.EMAIL_FROM}>`,
    ...opts,
  });
}
