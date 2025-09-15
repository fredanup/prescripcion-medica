import Image from 'next/image';
import CreateAppointmentModal from 'pages/modals/create-appointment-modal';
import PaymentModal from 'pages/modals/payment-modal';
import { useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { appointmentStatusLabel } from 'utils/appointmentStatusLabel';
import { IEditAppointment } from 'utils/auth';
import { trpc } from 'utils/trpc';

export default function Appointments() {
  const [editIsOpen, setEditIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<IEditAppointment | null>(null);

  const { data: appointments, refetch } =
    trpc.appointment.findMyAppointments.useQuery();

  const payForAppointment = trpc.appointment.markAsPaid.useMutation({
    onSuccess: () => {
      alert('Pago realizado con éxito. El médico ha sido notificado.');
      refetch();
    },
  });

  const openEditModal = (appointment: IEditAppointment | null) => {
    setSelectedAppointment(appointment);
    setEditIsOpen(true);
  };

  const closeEditModal = () => {
    setEditIsOpen(false);
  };

  const statusColor: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <>
      <Layout>
        <div className="flex flex-col mb-4">
          <div className="flex items-center justify-between">
            <FormTitle text="Citas" />
            <button
              onClick={() => openEditModal(null)}
              className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-6 py-2 rounded shadow flex items-center gap-2"
            >
              Agregar
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Aquí puedes ver y gestionar tus próximas citas con el médico.
          </p>
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
                  key={index}
                  className="border-b border-gray-200 text-sm font-light"
                >
                  <td className="py-4 pr-2 flex flex-row gap-3 items-center">
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
                      timeZone: 'America/Lima', // <- fija la zona
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false, // <- fuerza 24h (sin “a. m.” / “p. m.”)
                    })}
                  </td>

                  <td className="py-4 pr-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        statusColor[appointment.status]
                      }`}
                    >
                      {appointmentStatusLabel[appointment.status]}
                    </span>
                  </td>

                  <td className="py-4">
                    {appointment.status === 'pending_payment' && (
                      <button
                        onClick={() => {
                          setSelectedAppointmentId(appointment.id);
                          setPaymentAmount(appointment.specialty.price); // 🔹 precio viene de Specialty
                          setIsPaymentOpen(true);
                        }}
                        className="rounded-md border font-medium border-sky-500 text-sky-500 mr-4 py-2 px-4 hover:bg-sky-500 hover:text-white transition-colors"
                      >
                        Pagar
                      </button>
                    )}
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

      {isPaymentOpen && (
        <PaymentModal
          totalAmount={paymentAmount}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={() => {
            if (selectedAppointmentId) {
              payForAppointment.mutate({
                appointmentId: selectedAppointmentId,
              });
            }
          }}
        />
      )}
    </>
  );
}
