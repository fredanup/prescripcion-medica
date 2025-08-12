import Image from 'next/image';
import ReactDatePicker from 'react-datepicker';
import { useRouter } from 'next/router';
import { useRef, useState, useMemo } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { trpc } from 'utils/trpc';
import 'react-datepicker/dist/react-datepicker.css';
import { useSession } from 'next-auth/react';

function getInitials(name?: string | null, lastName?: string | null) {
  const n = (name ?? '').trim().split(' ')[0];
  const l = (lastName ?? '').trim().split(' ')[0];
  return `${n ? n[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'U';
}

function Avatar({
  src,
  name,
  lastName,
}: {
  src?: string | null;
  name?: string | null;
  lastName?: string | null;
}) {
  if (src) {
    return (
      <Image
        className="rounded-full"
        width={48}
        height={48}
        src={src}
        alt={`${name ?? 'Usuario'} avatar`}
      />
    );
  }
  return (
    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {getInitials(name, lastName)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    confirmed: {
      text: 'Confirmada',
      cls: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    completed: {
      text: 'Completada',
      cls: 'bg-green-50 text-green-700 border-green-200',
    },
    pending_payment: {
      text: 'Pago pendiente',
      cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    cancelled: {
      text: 'Cancelada',
      cls: 'bg-red-50 text-red-700 border-red-200',
    },
  };
  const cfg = map[status] ?? {
    text: status,
    cls: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cfg.cls}`}
    >
      {cfg.text}
    </span>
  );
}

export default function Callings() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const datepickerRef = useRef<any>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: appointments, isLoading } =
    trpc.appointment.findDoctorAppointmentsByDate.useQuery(
      { date: selectedDate }, // <- Input del query
      {
        enabled: !!session?.user?.doctorId, // Solo ejecutar si hay sesión válida
        retry: false, // No reintentar en caso de error de autenticación
        refetchOnWindowFocus: false,
      },
    );

  const isEmpty = !isLoading && (!appointments || appointments.length === 0);

  const total = useMemo(() => appointments?.length ?? 0, [appointments]);

  const handleAttend = (appointmentId: string) => {
    router.push(`/dashboard/consultations/${appointmentId}`);
  };

  return (
    <Layout>
      <FormTitle text="Citas por Atender" />

      {/* Filtro por fecha */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Seleccionar fecha:
        </label>
        <div className="relative inline-block">
          <ReactDatePicker
            ref={datepickerRef}
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            className="cursor-pointer w-48 bg-[#F7F7F8] border border-[#E4E8EB] rounded-md px-10 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-shadow"
            calendarClassName="!z-50"
          />
          {/* ícono calendario + caret */}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
          </svg>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Contenedor principal como card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header de card */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Cargando citas…'
              : `${total} resultado${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Loading / Empty / Table */}
        {isLoading ? (
          <div className="p-4">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 text-left text-gray-700 text-sm font-semibold">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Historial Breve</th>
                  <th className="py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-9 w-24 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isEmpty ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-blue-600"
                fill="currentColor"
              >
                <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm3 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Z" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-gray-800">
              No hay citas para{' '}
              {selectedDate.toLocaleDateString('es-PE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona otra fecha o crea una nueva cita.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                className="border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-2 rounded"
                onClick={() => {
                  setSelectedDate(new Date());
                  datepickerRef.current?.setFocus?.();
                }}
              >
                Hoy
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 text-left text-gray-700 text-sm font-semibold">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Historial Breve</th>
                  <th className="py-3 px-4 w-40">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {appointments?.map((appt, index) => (
                  <tr
                    className="border-t border-gray-100 hover:bg-gray-50 transition"
                    key={index}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={appt.patient.user.image}
                          name={appt.patient.user.name}
                          lastName={appt.patient.user.lastName}
                        />
                        <div className="flex flex-col">
                          <p className="font-medium">
                            {appt.patient.user.name}{' '}
                            {appt.patient.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appt.patient.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">{appt.specialty.name}</td>

                    <td className="py-4 px-4">
                      {new Date(appt.date).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-4 px-4">{'No especificado'}</td>

                    <td className="py-4 px-4">
                      {appt.patient.clinicalHistory?.[0]?.summary ??
                        'Sin historial'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={appt.status} />
                        {appt.status === 'confirmed' && (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-4 py-2 rounded shadow-sm"
                            onClick={() => handleAttend(appt.id)}
                          >
                            Atender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
