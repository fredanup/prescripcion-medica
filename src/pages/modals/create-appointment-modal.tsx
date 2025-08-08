import { FormEvent, useEffect, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import FormTitle from 'utilities/form-title';
import { IEditAppointment } from 'utils/auth';
import { trpc } from 'utils/trpc';
import 'react-datepicker/dist/react-datepicker.css';

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  selectedAppointment,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedAppointment: IEditAppointment | null;
}) {
  const [specialtyId, setSpecialtyId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [takenSlots, setTakenSlots] = useState<Date[]>([]);

  const { data: specialties } = trpc.specialty.findAll.useQuery();
  const { data: doctors } = trpc.doctor.findBySpecialty.useQuery(
    { id: specialtyId },
    { enabled: !!specialtyId },
  );
  const { data: slots, refetch: fetchTakenSlots } =
    trpc.appointment.findTakenSlots.useQuery(
      { doctorId },
      { enabled: !!doctorId },
    );

  const utils = trpc.useContext();
  const createAppointment = trpc.appointment.create.useMutation({
    onSuccess: async () => {
      await utils.appointment.findMyAppointments.invalidate();
      onClose();
    },
  });

  useEffect(() => {
    if (slots) {
      setTakenSlots(slots.map((s) => new Date(s)));
    }
  }, [slots]);

  useEffect(() => {
    if (selectedAppointment !== null) {
      setDoctorId(selectedAppointment.doctorId);
      setSpecialtyId(selectedAppointment.specialtyId);
      setAppointmentDate(
        selectedAppointment.date ? new Date(selectedAppointment.date) : null,
      );
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (doctorId) {
      fetchTakenSlots();
    }
  }, [doctorId, fetchTakenSlots]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorId || !specialtyId || !appointmentDate) return;

    const isSlotTaken = takenSlots.some(
      (slot) =>
        Math.abs(slot.getTime() - appointmentDate.getTime()) < 15 * 60 * 1000,
    );

    if (isSlotTaken) {
      alert('La hora seleccionada ya está ocupada. Por favor, elija otra.');
      return;
    }

    createAppointment.mutate({
      doctorId,
      specialtyId,
      date: appointmentDate,
      notes,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full bg-gray-800 opacity-60 z-20"></div>
      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white p-6 rounded-lg w-11/12 md:max-w-lg shadow-lg border border-gray-100"
      >
        <FormTitle text="Reservar cita médica" />
        <p className="text-sm text-gray-500 mb-6">
          Complete los siguientes datos para agendar su cita.
        </p>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Especialidad
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={specialtyId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setSpecialtyId(selectedId);
              const selected = specialties?.find((s) => s.id === selectedId);
              setPrice(selected?.price ?? null);
            }}
          >
            <option value="">Seleccionar</option>
            {specialties?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {price !== null && (
            <p className="text-sm text-gray-500 mt-1">
              Precio de la consulta:{' '}
              <span className="font-semibold text-gray-700">
                S/ {price.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Médico
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Seleccionar</option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name} {doctor.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Fecha y hora
            </label>
            <ReactDatePicker
              selected={appointmentDate}
              onChange={setAppointmentDate}
              showTimeSelect
              dateFormat="Pp"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            className="px-5 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 text-sm font-medium transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm transition"
          >
            Guardar
          </button>
        </div>
      </form>
    </>
  );
}
