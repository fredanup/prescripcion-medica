import { Appointment, Doctor, Patient, Specialty, User } from '@prisma/client';

export type AppointmentWithDoctorUser = Appointment & {
  doctor: Doctor & {
    user: User;
  };
  patient: Patient & {
    user: User;
  };
  specialty: Specialty;
};
