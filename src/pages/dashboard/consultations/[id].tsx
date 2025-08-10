import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/router';
import { trpc } from 'utils/trpc';
import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';

type Prescription = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
};

export default function ConsultationForm() {
  const router = useRouter();
  const { id: appointmentId } = router.query;

  const utils = trpc.useContext();

  const {
    mutateAsync: createConsultation,
    isPending,
    error: mutationError,
  } = trpc.consultation.create.useMutation({
    onSuccess: async () => {
      await utils.appointment.findDoctorAppointmentsByDate.invalidate();
      router.push('/dashboard/callings');
    },
  });

  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medication: '', dosage: '', frequency: '', duration: '', route: '' },
  ]);

  const inputClass =
    'w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-shadow';

  const addPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medication: '', dosage: '', frequency: '', duration: '', route: '' },
    ]);
  };

  const removePrescription = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const transformedIndications = useMemo(
    () =>
      indications
        .map((ind) => ind.trim())
        .filter(Boolean)
        .map((ind) => ({ instruction: ind, notes: '' })),
    [indications],
  );

  const buildPayload = () => {
    return {
      appointmentId: typeof appointmentId === 'string' ? appointmentId : '',
      reason,
      diagnosis,
      plan,
      notes,
      indications: transformedIndications,
      prescriptions: prescriptions.map((rx) => ({ ...rx })),
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!router.isReady) {
      alert('La ruta aún no está lista. Intenta de nuevo.');
      return;
    }
    if (typeof appointmentId !== 'string' || !appointmentId) {
      alert('Cita no válida. ID: ' + appointmentId);
      return;
    }
    if (prescriptions.some((p) => !p.medication.trim())) {
      alert('Todos los medicamentos deben tener nombre.');
      return;
    }

    const payload = buildPayload();
    // 🔍 Debug útil
    console.log('[createConsultation] payload:', payload);

    try {
      createConsultation(payload);
      // onSuccess navega y hace invalidate
    } catch (err: any) {
      // Mostramos error detallado si es de tRPC/Zod
      const zodIssues = err?.data?.zodError?.fieldErrors;
      if (zodIssues) {
        const detalles = Object.entries(zodIssues)
          .map(([k, v]) => `• ${k}: ${(Array.isArray(v) ? v : []).join(', ')}`)
          .join('\n');
        alert('Validación falló:\n' + detalles);
      } else {
        alert(err?.message ?? 'Ocurrió un error al guardar.');
      }
      console.error('[createConsultation] error:', err);
    }
  };

  if (!router.isReady) {
    return (
      <div className="h-[50vh] grid place-items-center">
        <p className="text-sm text-gray-500">Cargando…</p>
      </div>
    );
  }

  return (
    <Layout>
      <FormTitle text="Atención Médica" />

      {/* Error visible si viene del backend */}
      {mutationError && (
        <div className="max-w-4xl mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-1">
              No se pudo registrar la consulta
            </p>
            <p>{mutationError.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6 text-sm">
          {/* Motivo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Motivo de consulta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Describe brevemente el motivo de la consulta…"
              className={inputClass}
            />
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Diagnóstico
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Plan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              required
              rows={3}
              placeholder="Ej. tratamiento, exámenes, control, etc."
              className={inputClass}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones complementarias…"
              className={inputClass}
            />
          </div>

          {/* Indicaciones */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Indicaciones generales
            </label>
            <textarea
              onChange={(e) => setIndications(e.target.value.split('\n'))}
              rows={3}
              placeholder="Una por línea (ej.: Tomar 1 tableta cada 8 horas)"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Se separarán automáticamente por salto de línea.
            </p>
          </div>

          {/* Recetas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recetas médicas
            </label>

            <div className="space-y-2">
              {prescriptions.map((pres, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start"
                >
                  {(
                    [
                      'medication',
                      'dosage',
                      'frequency',
                      'duration',
                      'route',
                    ] as const
                  ).map((field) => (
                    <input
                      key={field}
                      placeholder={
                        field === 'medication'
                          ? 'Medicamento*'
                          : field === 'dosage'
                          ? 'Dosis'
                          : field === 'frequency'
                          ? 'Frecuencia'
                          : field === 'duration'
                          ? 'Duración'
                          : 'Vía'
                      }
                      value={pres[field]}
                      onChange={(e) => {
                        const copy = [...prescriptions];
                        copy[idx][field] = e.target.value;
                        setPrescriptions(copy);
                      }}
                      required={field === 'medication'}
                      className={inputClass}
                    />
                  ))}

                  <div className="sm:col-span-5">
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrescription(idx)}
                        className="mt-1 border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-3 py-1 rounded text-xs"
                        disabled={isPending}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={addPrescription}
                className="border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-2 rounded"
                disabled={isPending}
              >
                + Agregar medicamento
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-5 py-2 rounded disabled:opacity-60"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-6 py-2 rounded shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? 'Guardando…' : 'Guardar consulta'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
