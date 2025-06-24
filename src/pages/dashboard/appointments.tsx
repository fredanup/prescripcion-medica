import Image from 'next/image';
import CreateAppointmentModal from 'pages/modals/create-appointment-modal';
import { useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { appointmentStatusLabel } from 'utils/appointmentStatusLabel';
import { IEditAppointment } from 'utils/auth';
import { trpc } from 'utils/trpc';

export default function Appointments() {
  const [editIsOpen, setEditIsOpen] = useState(false);
  //Hook de estado que almacena el registro seleccionado
  const [selectedAppointment, setSelectedAppointment] =
    useState<IEditAppointment | null>(null);

  const { data: appointments } = trpc.appointment.findMyAppointments.useQuery();
  const payForAppointment = trpc.appointment.markAsPaid.useMutation({
    onSuccess: () => {
      alert('Pago realizado con éxito. El médico ha sido notificado.');
      // Opcional: invalidate lista de citas
    },
  });

  //Función de selección de registro y apertura de modal de edición
  const openEditModal = (appointment: IEditAppointment | null) => {
    setSelectedAppointment(appointment);
    setEditIsOpen(true);
  };
  //Función de cierre de modal de edición
  const closeEditModal = () => {
    setEditIsOpen(false);
  };

  const statusColor: Record<string, string> = {
    pending_payment: 'text-yellow-600',
    confirmed: 'text-blue-600',
    cancelled: 'text-red-600',
    completed: 'text-green-600',
  };

  return (
    <>
      <svg
        viewBox="0 0 512 512"
        className={`fixed bottom-20 z-10 right-8 h-12 w-12 cursor-pointer rounded-lg fill-blue-600 drop-shadow-lg md:hidden ${
          editIsOpen ? 'hidden' : ''
        }`}
        onClick={(event) => {
          event.stopPropagation();
          openEditModal(null);
        }}
      >
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
      </svg>
      <Layout>
        <FormTitle text="Citas" />
        <div className="flex flex-row justify-between mb-4">
          <div
            className="hidden md:w-32 md:rounded-full md:border md:cursor-pointer md:drop-shadow-lg md:bg-blue-600 md:p-2 md:items-center md:flex md:flex-row md:gap-1 md:justify-center"
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(null);
            }}
          >
            <svg viewBox="0 0 448 512" className={`h-4 w-4 fill-white`}>
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>

            <p className="text-white text-base font-medium ">Agregar</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-200 text-left text-black text-sm font-light">
              <tr>
                <th className="py-4 pr-2">Médico</th>
                <th className="py-4 pr-2">Especialidad</th>
                <th className="py-4 pr-2">Fecha</th>
                <th className="py-4 pr-2">Estado</th>
                <th className="py-4 pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((appointment, index) => (
                <tr
                  className="border-b border-gray-200 text-sm font-light"
                  key={index}
                >
                  <td className="py-4 pr-2 flex flex-row gap-3 items-center text-sm font-light">
                    <Image
                      className="rounded-full"
                      width={50}
                      height={50}
                      src={appointment.doctor.user.image ?? ''}
                      alt="Doctor Avatar"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        Dr. {appointment.doctor.user.name}{' '}
                        {appointment.doctor.user.lastName}
                      </p>
                      <p className="font-light text-xs">
                        {appointment.doctor.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pr-2">{appointment.specialty.name}</td>
                  <td className="py-4 pr-2">
                    {new Date(appointment.date).toLocaleString('es-PE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td
                    className={`py-4 pr-2 font-medium ${
                      statusColor[appointment.status]
                    }`}
                  >
                    {appointmentStatusLabel[appointment.status]}
                  </td>
                  <td className="py-4">
                    <button
                      className="rounded-md border font-medium border-sky-500 text-sky-500 mr-4 py-2 px-4 hover:bg-sky-500 hover:text-white transition-colors"
                      onClick={() =>
                        payForAppointment.mutate({
                          appointmentId: appointment.id,
                        })
                      }
                    >
                      Pagar
                    </button>
                    <button
                      className="rounded-md border font-medium border-pink-500 text-pink-500 py-2 px-4 hover:bg-pink-500 hover:text-white transition-colors"
                      onClick={() => {
                        // Acción: cancelar o reprogramar
                      }}
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>
      {editIsOpen && (
        <CreateAppointmentModal
          isOpen={editIsOpen}
          onClose={closeEditModal}
          selectedAppointment={selectedAppointment}
        />
      )}
    </>
  );
}
