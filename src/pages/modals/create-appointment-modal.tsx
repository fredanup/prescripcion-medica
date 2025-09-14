import { FormEvent, useEffect, useMemo, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import FormTitle from 'utilities/form-title';
import { IEditAppointment } from '../../utils/auth';
import { trpc } from 'utils/trpc';
import 'react-datepicker/dist/react-datepicker.css';

/* ===================== */
/* Utilidades de FECHAS  */
/* ===================== */

const PERU_TZ = 'America/Lima';
const PERU_OFFSET = '-05:00'; // Perú no usa DST

// Hoy 00:00 en Lima
const startOfTodayInPeru = (): Date => {
  const now = new Date();
  const y = now.toLocaleString('en-CA', { timeZone: PERU_TZ, year: 'numeric' });
  const m = now.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    month: '2-digit',
  });
  const d = now.toLocaleString('en-CA', { timeZone: PERU_TZ, day: '2-digit' });
  return new Date(`${y}-${m}-${d}T00:00:00${PERU_OFFSET}`);
};

// “Ahora” en Lima
const nowInPeru = (): Date => {
  const now = new Date();
  const y = now.toLocaleString('en-CA', { timeZone: PERU_TZ, year: 'numeric' });
  const m = now.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    month: '2-digit',
  });
  const d = now.toLocaleString('en-CA', { timeZone: PERU_TZ, day: '2-digit' });
  const hh = now.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    hour: '2-digit',
    hour12: false,
  });
  const mm = now.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    minute: '2-digit',
  });
  const ss = now.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    second: '2-digit',
  });
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}${PERU_OFFSET}`);
};

// ¿d1 y d2 son el mismo día en Lima?
const isSameCalendarDayPeru = (d1: Date, d2: Date): boolean => {
  const f = (x: Date) =>
    x.toLocaleString('en-CA', {
      timeZone: PERU_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  return f(d1) === f(d2);
};

// ¿fecha (sin hora) no es anterior a hoy Lima?
const isDateValidDay = (date: Date | null): boolean => {
  if (!date) return false;
  const y = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    year: 'numeric',
  });
  const m = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    month: '2-digit',
  });
  const d = date.toLocaleString('en-CA', { timeZone: PERU_TZ, day: '2-digit' });
  const dateAtMidnightPeru = new Date(`${y}-${m}-${d}T00:00:00${PERU_OFFSET}`);
  return dateAtMidnightPeru.getTime() >= startOfTodayInPeru().getTime();
};

// ¿fecha/hora >= ahora en Lima?
const isDateTimeInFuturePeru = (date: Date | null): boolean => {
  if (!date) return false;
  const y = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    year: 'numeric',
  });
  const m = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    month: '2-digit',
  });
  const d = date.toLocaleString('en-CA', { timeZone: PERU_TZ, day: '2-digit' });
  const hh = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    hour: '2-digit',
    hour12: false,
  });
  const mm = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    minute: '2-digit',
  });
  const ss = date.toLocaleString('en-CA', {
    timeZone: PERU_TZ,
    second: '2-digit',
  });
  const selectedPeru = new Date(
    `${y}-${m}-${d}T${hh}:${mm}:${ss}${PERU_OFFSET}`,
  );
  return selectedPeru.getTime() >= nowInPeru().getTime();
};

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Mapear slots ocupados (asumiendo ISO/UTC desde el server)
  useEffect(() => {
    if (slots) setTakenSlots(slots.map((s) => new Date(s)));
  }, [slots]);

  // Cargar valores si se edita
  useEffect(() => {
    if (selectedAppointment) {
      setDoctorId(selectedAppointment.doctorId);
      setSpecialtyId(selectedAppointment.specialtyId);
      setAppointmentDate(
        selectedAppointment.date ? new Date(selectedAppointment.date) : null,
      );
    }
  }, [selectedAppointment]);

  // Refetch de slots al cambiar de médico
  useEffect(() => {
    if (doctorId) fetchTakenSlots();
  }, [doctorId, fetchTakenSlots]);

  // Evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const isSaving = createAppointment.isPending;
  const formHasBasics = !!doctorId && !!specialtyId && !!appointmentDate;

  // ¿slot tomado en ±15 min?
  const isSlotTaken = useMemo(() => {
    if (!appointmentDate) return false;
    const target = appointmentDate.getTime();
    return takenSlots.some(
      (slot) => Math.abs(slot.getTime() - target) < 15 * 60 * 1000,
    );
  }, [takenSlots, appointmentDate]);

  // Para DatePicker: minDate (día) + minTime (hora si es hoy)
  const minDatePeru = startOfTodayInPeru();
  const minTimeForSelectedDay = useMemo(() => {
    if (!appointmentDate) return undefined;
    return isSameCalendarDayPeru(appointmentDate, minDatePeru)
      ? nowInPeru()
      : undefined;
  }, [appointmentDate, minDatePeru]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formHasBasics) return;

    // Validar día (no pasado)
    if (!isDateValidDay(appointmentDate)) {
      setErrorMsg('No se puede crear una cita en una fecha pasada.');
      return;
    }

    // Validar hora si es hoy (>= ahora Lima)
    if (!isDateTimeInFuturePeru(appointmentDate)) {
      setErrorMsg('La hora seleccionada ya pasó. Elige una hora futura.');
      return;
    }

    if (isSlotTaken) {
      setErrorMsg(
        'La hora seleccionada ya está ocupada. Por favor, elija otra.',
      );
      return;
    }

    // Nota: ideal enviar en ISO UTC y normalizar en backend
    createAppointment.mutate({
      doctorId,
      specialtyId,
      date: appointmentDate, // o: new Date(appointmentDate.toISOString())
      notes,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                   w-11/12 max-w-xl bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6"
      >
        <FormTitle text="Reservar cita médica" />
        <p className="text-sm text-gray-500 mb-6">
          Complete los siguientes datos para agendar su cita.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] p-3 text-sm text-[#374151]">
            {errorMsg}
          </div>
        )}

        {/* Especialidad */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-[#374151] mb-1">
            Especialidad
          </label>
          <select
            className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={specialtyId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setSpecialtyId(selectedId);
              const selected = specialties?.find((s) => s.id === selectedId);
              setPrice(selected?.price ?? null);
              setErrorMsg(null);
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
              <span className="font-semibold text-[#374151]">
                S/ {price.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Médico + Fecha */}
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">
              Médico
            </label>
            <select
              className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setErrorMsg(null);
              }}
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
            <label className="block text-sm font-semibold text-[#374151] mb-1">
              Fecha y hora
            </label>
            <ReactDatePicker
              selected={appointmentDate}
              onChange={(d) => {
                setAppointmentDate(d);
                setErrorMsg(null);
              }}
              showTimeSelect
              timeIntervals={15}
              dateFormat="Pp"
              required
              minDate={minDatePeru} // bloquea días pasados
              minTime={minTimeForSelectedDay} // si es hoy, bloquea horas pasadas
              className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholderText="Seleccionar"
            />
            {appointmentDate && isSlotTaken && (
              <p className="text-xs text-red-600 mt-1">
                La hora seleccionada está ocupada.
              </p>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#374151] mb-1">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Opcional"
          />
        </div>

        {/* Acciones */}
        <div className="pt-4 flex justify-end gap-2 border-t border-[#E4E8EB]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] text-sm font-medium text-[#374151]
                       transition-colors hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!formHasBasics || isSaving || isSlotTaken}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold shadow-sm
                       transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </>
  );
}
