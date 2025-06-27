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

      <div className="mb-4">
        <label className="text-sm font-bold text-black">
          Seleccionar Fecha:
        </label>
        <ReactDatePicker
          selected={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          dateFormat="dd/MM/yyyy"
          className="mt-1 border rounded px-2 py-1"
        />
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
                    <button
                      className="rounded-md border font-medium border-green-600 text-green-600 py-2 px-4 hover:bg-green-600 hover:text-white transition-colors"
                      onClick={() => handleAttend(appt.id)}
                    >
                      Atender
                    </button>
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
