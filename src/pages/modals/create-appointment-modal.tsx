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

  const { data: specialties } = trpc.specialty.findAll.useQuery();
  const { data: doctors } = trpc.doctor.findBySpecialty.useQuery(
    { id: specialtyId },
    {
      enabled: !!specialtyId,
    },
  );
  const utils = trpc.useContext();
  const createAppointment = trpc.appointment.create.useMutation({
    onSuccess: async () => {
      await utils.appointment.findMyAppointments.invalidate();

      onClose();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorId || !specialtyId || !appointmentDate) return;

    createAppointment.mutate({
      doctorId,
      specialtyId,
      date: appointmentDate,
      notes,
    });
  };

  useEffect(() => {
    if (selectedAppointment !== null) {
      setDoctorId(selectedAppointment.doctorId);
      setSpecialtyId(selectedAppointment.specialtyId);
      setAppointmentDate(
        selectedAppointment.date ? new Date(selectedAppointment.date) : null,
      );
    }
  }, [selectedAppointment]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full bg-gray-800 opacity-60 z-20"></div>
      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white p-8 rounded-lg w-11/12 md:w-auto"
      >
        <FormTitle text="Reservar cita médica" />
        <p className="text-sm text-gray-500 mb-4">
          Complete los datos para agendar su cita.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <label className="text-black text-sm font-bold">
              Especialidad:
            </label>
          </div>

          <div>
            <select
              className="block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={specialtyId}
              onChange={(event) => setSpecialtyId(event.target.value)}
            >
              <option value="">Seleccionar</option>
              {specialties?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <label className="text-black text-sm font-bold">Médico:</label>
          </div>

          <div>
            <select
              className="block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
            >
              <option value="">Seleccionar</option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name} {doctor.user.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-black text-sm font-bold">Fecha y hora</label>
          <ReactDatePicker
            selected={appointmentDate}
            onChange={setAppointmentDate}
            className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
            showTimeSelect
            dateFormat="Pp"
            required
          />
        </div>

        <div className="mb-2">
          <label className="text-sm font-bold">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border px-2 py-1"
          />
        </div>
        <div className="mt-4 pt-4 flex flex-row justify-end gap-2 border-t border-gray-200">
          <button
            type="button"
            className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`px-4 py-1 rounded text-white bg-sky-500`}
          >
            Guardar
          </button>
        </div>
      </form>
    </>
  );
}
