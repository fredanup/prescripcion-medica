import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';
import Image from 'next/image';
import ReactDatePicker from 'react-datepicker';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { trpc } from 'utils/trpc';
import 'react-datepicker/dist/react-datepicker.css';

export default function Callings() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: appointments, isLoading } =
    trpc.appointment.findDoctorAppointmentsByDate.useQuery({
      date: selectedDate,
    });

  const router = useRouter();

  const handleAttend = (appointmentId: string) => {
    router.push(`/dashboard/consultations/${appointmentId}`);
  };

  return (
    <Layout>
      <FormTitle text="Citas por Atender" />
      <div className="mb-6 ">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Seleccionar fecha:
        </label>
        <div className="relative inline-block">
          <ReactDatePicker
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            className="cursor-pointer w-48 border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            calendarClassName="!z-50"
          />
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-gray-500 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando citas...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-200 text-left text-black text-sm font-light">
              <tr>
                <th className="py-4 pr-2">Paciente</th>
                <th className="py-4 pr-2">Especialidad</th>
                <th className="py-4 pr-2">Hora</th>
                <th className="py-4 pr-2">Motivo</th>
                <th className="py-4 pr-2">Historial Breve</th>
                <th className="py-4 pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((appt, index) => (
                <tr
                  className="border-b border-gray-200 text-sm font-light"
                  key={index}
                >
                  <td className="py-4 pr-2 flex flex-row gap-3 items-center text-sm font-light">
                    <Image
                      className="rounded-full"
                      width={50}
                      height={50}
                      src={appt.patient.user.image ?? ''}
                      alt="Avatar"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {appt.patient.user.name} {appt.patient.user.lastName}
                      </p>
                      <p className="font-light text-xs">
                        {appt.patient.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pr-2">{appt.specialty.name}</td>
                  <td className="py-4 pr-2">
                    {new Date(appt.date).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-4 pr-2">{'No especificado'}</td>
                  <td className="py-4 pr-2">
                    {appt.patient.clinicalHistory?.[0]?.summary ??
                      'Sin historial'}
                  </td>
                  <td className="py-4 pr-2">
                    {appt.status === 'confirmed' && (
                      <button
                        className="bg-green-600 hover:bg-green-700 transition text-white font-semibold px-6 py-2 rounded shadow"
                        onClick={() => handleAttend(appt.id)}
                      >
                        Atender
                      </button>
                    )}

                    {appt.status === 'completed' && (
                      <span className="text-sm text-gray-500 italic">
                        Atención completada
                      </span>
                    )}

                    {appt.status === 'pending_payment' && (
                      <span className="text-sm text-yellow-600 italic">
                        Pago pendiente
                      </span>
                    )}

                    {appt.status === 'cancelled' && (
                      <span className="text-sm text-red-600 italic">
                        Cita cancelada
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
