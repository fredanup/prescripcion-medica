import nodemailer from 'nodemailer';
import { AppointmentWithDoctorUser } from 'types/email';

export async function sendEmailToDoctor(appointment: AppointmentWithDoctorUser) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

await transporter.sendMail({
  from: `"Sistema Médico" <${process.env.EMAIL_FROM}>`,
  to: appointment.doctor.user.email,
  subject: 'Nueva cita confirmada',
  text: `Hola Dr. ${appointment.doctor.user.name}, el paciente ${appointment.patient.user.name} ha reservado una cita...`,
  html: `
    <p>Hola Dr. ${appointment.doctor.user.name},</p>
    <p>El paciente <strong>${appointment.patient.user.name} ${appointment.patient.user.lastName}</strong> ha reservado una cita para la especialidad <strong>${appointment.specialty.name}</strong>.</p>
    <p><strong>Fecha y hora:</strong> ${appointment.date.toLocaleString('es-PE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima',
})
}</p>
    <p>Por favor revise su agenda.</p>
  `,
});

}