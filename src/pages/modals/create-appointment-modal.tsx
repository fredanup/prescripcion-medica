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

// Fecha (00:00) de HOY en Lima
const getTodayInPeru = (): Date => {
  const now = new Date();
  const peruDateString = now.toLocaleDateString('en-CA', { timeZone: PERU_TZ });
  // ISO parcial (YYYY-MM-DD) interpretado en local → suficiente para base de horas
  return new Date(peruDateString + 'T00:00:00');
};

// “Ahora” en Lima (fecha+hora)
const getNowInPeru = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: PERU_TZ }));
};

// ¿Mismo día en Lima?
const isSameDay = (date1: Date, date2: Date): boolean => {
  const d1String = date1.toLocaleDateString('en-CA', { timeZone: PERU_TZ });
  const d2String = date2.toLocaleDateString('en-CA', { timeZone: PERU_TZ });
  return d1String === d2String;
};

// Día válido (no anterior a hoy Lima)
const isValidDate = (date: Date | null): boolean => {
  if (!date) return false;
  const today = getTodayInPeru();
  const selectedDay = new Date(
    date.toLocaleDateString('en-CA', { timeZone: PERU_TZ }) + 'T00:00:00',
  );
  return selectedDay >= today;
};

// Fecha/hora en el futuro (con buffer)
const isDateTimeInFuture = (date: Date | null): boolean => {
  if (!date) return false;
  const now = getNowInPeru();

  if (!isSameDay(date, now)) {
    return isValidDate(date);
  }

  const dateInPeru = new Date(
    date.toLocaleString('en-US', { timeZone: PERU_TZ }),
  );
  const buffer = 5 * 60 * 1000; // 5 min
  return dateInPeru.getTime() > now.getTime() + buffer;
};

// Helper: setear hora sobre una fecha base
const withTime = (base: Date, h: number, m = 0, s = 0, ms = 0) => {
  const d = new Date(base);
  d.setHours(h, m, s, ms);
  return d;
};

const BUSINESS_START_H = 8; // 08:00
const BUSINESS_END_H = 18; // 18:00

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
      // Limpiar el formulario
      setSpecialtyId('');
      setDoctorId('');
      setAppointmentDate(null);
      setNotes('');
      setPrice(null);
      setErrorMsg(null);
    },
  });

  // Mapear slots ocupados
  useEffect(() => {
    if (slots) {
      setTakenSlots(slots.map((s) => new Date(s)));
    }
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
    if (doctorId) {
      fetchTakenSlots();
    }
  }, [doctorId, fetchTakenSlots]);

  // Evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
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

  // Configuración base para DatePicker
  const minDate = getTodayInPeru();

  // Siempre proveemos ambos: minTime y maxTime
  const { minTime, maxTime } = useMemo(() => {
    // Base para construir horas: la fecha seleccionada o hoy
    const base = appointmentDate ?? minDate;

    const startOfDay = withTime(base, BUSINESS_START_H, 0, 0, 0);
    const endOfDay = withTime(base, BUSINESS_END_H, 0, 0, 0);

    // Si es el mismo día, que minTime sea max(ahora+10min, inicioJornada)
    if (appointmentDate && isSameDay(appointmentDate, minDate)) {
      const nowPlus10 = new Date(getNowInPeru().getTime() + 10 * 60 * 1000);
      const todayMin = nowPlus10 > startOfDay ? nowPlus10 : startOfDay;
      return {
        minTime: todayMin < endOfDay ? todayMin : startOfDay,
        maxTime: endOfDay,
      };
    }

    // Días futuros (o sin selección): horario comercial estándar
    return {
      minTime: startOfDay,
      maxTime: endOfDay,
    };
  }, [appointmentDate, minDate]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formHasBasics) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Validar día
    if (!isValidDate(appointmentDate)) {
      setErrorMsg('No se puede crear una cita en una fecha pasada.');
      return;
    }

    // Validar hora para hoy
    if (!isDateTimeInFuture(appointmentDate)) {
      setErrorMsg('La hora seleccionada ya pasó. Elige una hora futura.');
      return;
    }

    // Validar slot disponible
    if (isSlotTaken) {
      setErrorMsg(
        'La hora seleccionada ya está ocupada. Por favor, elija otra.',
      );
      return;
    }

    // Crear la cita
    createAppointment.mutate({
      doctorId,
      specialtyId,
      date: appointmentDate,
      notes,
    });
  };

  const handleClose = () => {
    // Limpiar formulario al cerrar
    setSpecialtyId('');
    setDoctorId('');
    setAppointmentDate(null);
    setNotes('');
    setPrice(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
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
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Especialidad */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-[#374151] mb-1">
            Especialidad *
          </label>
          <select
            className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={specialtyId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setSpecialtyId(selectedId);
              setDoctorId(''); // reset al cambiar especialidad
              setAppointmentDate(null);
              const selected = specialties?.find((s) => s.id === selectedId);
              setPrice(selected?.price ?? null);
              setErrorMsg(null);
            }}
            required
          >
            <option value="">Seleccionar especialidad</option>
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
              Médico *
            </label>
            <select
              className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setAppointmentDate(null); // reset fecha al cambiar médico
                setErrorMsg(null);
              }}
              disabled={!specialtyId}
              required
            >
              <option value="">Seleccionar médico</option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name} {doctor.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">
              Fecha y hora *
            </label>
            <ReactDatePicker
              selected={appointmentDate}
              onChange={(date) => {
                setAppointmentDate(date);
                setErrorMsg(null);
              }}
              showTimeSelect
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              timeFormat="HH:mm"
              minDate={minDate}
              // Siempre presentes los dos para evitar el error
              minTime={minTime}
              maxTime={maxTime}
              disabled={!doctorId}
              required
              className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholderText="Seleccionar fecha y hora"
              timeCaption="Hora"
              excludeTimes={takenSlots}
            />
            {appointmentDate && isSlotTaken && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ La hora seleccionada está ocupada
              </p>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#374151] mb-1">
            Notas adicionales
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-lg border border-[#E4E8EB] bg-[#F7F7F8] px-3 py-2 text-[#374151]
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Información adicional sobre la consulta (opcional)"
          />
        </div>

        {/* Acciones */}
        <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E8EB]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-[#E4E8EB] bg-white text-sm font-medium text-[#374151]
                       transition-colors hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!formHasBasics || isSaving || isSlotTaken}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold shadow-sm
                       transition-colors hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              'Reservar cita'
            )}
          </button>
        </div>
      </form>
    </>
  );
}
