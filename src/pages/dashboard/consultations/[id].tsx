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

// Tipos locales para payloads nuevos
type DiagnosisItem = {
  id: string; // Para manejar edición/remoción
  code?: string;
  label: string;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
};
type OrderItem = {
  type: 'lab' | 'imaging';
  code?: string;
  label: string;
  priority?: 'normal' | 'urgent';
  notes?: string;
};

export default function ConsultationForm() {
  const router = useRouter();
  const { id: appointmentId } = router.query;

  const utils = trpc.useContext();

  // Guardamos el id de la consulta creada para enlazar diagnóstico/órdenes
  const [consultationId, setConsultationId] = useState<string | null>(null); // NUEVO

  const {
    mutateAsync: createConsultation,
    isPending,
    error: mutationError,
  } = trpc.consultation.create.useMutation({
    onSuccess: async (created) => {
      // Esperamos que el backend retorne { id: string }
      if (created?.id) setConsultationId(created.id); // NUEVO
      await utils.appointment.findDoctorAppointmentsByDate.invalidate();
      // Sugerencia: ya no redirigir inmediatamente; dejamos que complete diagnóstico/órdenes.
      // router.push('/dashboard/callings');
    },
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'consulta' | 'diagnostico' | 'ordenes' | 'resumen'
  >('consulta');

  // Mutations nuevas según schema

  const closeConsultation = trpc.consultation.close.useMutation(); // NUEVO
  const saveDraft = trpc.consultation.saveDraft.useMutation();
  const createDiagnosis = trpc.consultation.createDiagnosis.useMutation(); // NUEVO
  const createOrders = trpc.consultation.createOrders.useMutation(); // NUEVO

  // Estado original
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState(''); // libre (se mantiene)
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medication: '', dosage: '', frequency: '', duration: '', route: '' },
  ]);

  // Estado para nuevos tabs
  const [dxItems, setDxItems] = useState<DiagnosisItem[]>([]); // NUEVO
  const [orderDraft, setOrderDraft] = useState<OrderItem>({
    type: 'lab',
    label: '',
  }); // NUEVO
  const [orders, setOrders] = useState<OrderItem[]>([]); // NUEVO

  const addDx = () => {
    setDxItems((prev) => [...prev, { id: crypto.randomUUID(), label: '' }]);
  };
  const removeDx = (id: string) => {
    setDxItems((prev) => prev.filter((d) => d.id !== id));
  };

  const canSaveDx =
    !!consultationId &&
    dxItems.length > 0 &&
    dxItems.every((d) => d.label.trim().length > 0);

  const inputClass =
    'w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow';

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

  const buildPayload = () => ({
    appointmentId: typeof appointmentId === 'string' ? appointmentId : '',
    reason,
    diagnosis, // libre
    plan,
    notes,
    indications: transformedIndications,
    prescriptions: prescriptions.map((rx) => ({ ...rx })),
  });

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
    try {
      const result = await createConsultation(payload);
      if (result?.id) {
        setConsultationId(result.id); // NUEVO
        setActiveTab('diagnostico'); // NUEVO: guiar al siguiente paso
      }
    } catch (err: any) {
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

      {/* Tabs */}
      <div className="max-w-4xl mb-4">
        <div className="bg-white border border-[#E4E8EB] rounded-xl p-1 flex gap-1">
          {[
            { k: 'consulta', t: 'Consulta' },
            { k: 'diagnostico', t: 'Diagnóstico' },
            { k: 'ordenes', t: 'Órdenes' },
            { k: 'resumen', t: 'Resumen' },
          ].map(({ k, t }) => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveTab(k as any)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  activeTab === (k as any)
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F7F7F8] text-[#374151] hover:bg-white border border-transparent'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Consulta */}
      {activeTab === 'consulta' && (
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6 space-y-6 text-sm">
            {/* Motivo */}
            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1">
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

            {/* Diagnóstico libre */}
            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1">
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
              <label className="block text-sm font-semibold text-[#374151] mb-1">
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
              <label className="block text-sm font-semibold text-[#374151] mb-1">
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
              <label className="block text-sm font-semibold text-[#374151] mb-1">
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
              <label className="block text-sm font-semibold text-[#374151] mb-2">
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
                          className="mt-1 px-3 py-1 rounded bg-[#F7F7F8] border border-[#E4E8EB] text-[#374151] text-xs hover:bg-white transition-colors disabled:opacity-60"
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
                  className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors disabled:opacity-60"
                  disabled={isPending}
                >
                  + Agregar medicamento
                </button>
              </div>
            </div>

            {/* Acciones del form */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E4E8EB]">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-5 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors disabled:opacity-60"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled={isPending}
              >
                {isPending ? 'Guardando…' : 'Guardar consulta'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 🔹 Diagnóstico (estructurado) */}
      {activeTab === 'diagnostico' && (
        <div className="max-w-4xl">
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6 space-y-4 text-sm">
            {!consultationId && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs text-yellow-800">
                Primero guarda la <strong>Consulta</strong> para generar el ID
                de consulta.
              </div>
            )}

            {/* Lista editable */}
            <div className="space-y-2">
              {dxItems.map((d, i) => (
                <div
                  key={d.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
                >
                  <input
                    placeholder="Código (opcional)"
                    value={d.code ?? ''}
                    onChange={(e) => {
                      const c = [...dxItems];
                      c[i] = { ...c[i], code: e.target.value };
                      setDxItems(c);
                    }}
                    className="md:col-span-2 w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <input
                    placeholder="Diagnóstico (label)*"
                    value={d.label}
                    onChange={(e) => {
                      const c = [...dxItems];
                      c[i] = { ...c[i], label: e.target.value };
                      setDxItems(c);
                    }}
                    className="md:col-span-4 w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <select
                    value={d.severity ?? ''}
                    onChange={(e) => {
                      const c = [...dxItems];
                      c[i] = { ...c[i], severity: e.target.value as any };
                      setDxItems(c);
                    }}
                    className="md:col-span-2 w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="">Severidad</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Severa</option>
                  </select>
                  <input
                    placeholder="Notas"
                    value={d.notes ?? ''}
                    onChange={(e) => {
                      const c = [...dxItems];
                      c[i] = { ...c[i], notes: e.target.value };
                      setDxItems(c);
                    }}
                    className="md:col-span-3 w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />

                  {/* Quitar */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeDx(d.id)}
                      className="px-3 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-xs font-medium text-[#374151] hover:bg-white transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones diagnóstico */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={addDx}
                className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors"
              >
                + Agregar diagnóstico
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canSaveDx || createDiagnosis.isPending}
                  onClick={() => {
                    if (!consultationId) return;
                    createDiagnosis.mutate(
                      {
                        consultationId,
                        items: dxItems.map(({ ...rest }) => rest), // quitamos el id local
                      },
                      {
                        onSuccess: () => {
                          // feedback simple y avanzar
                          setActiveTab('ordenes');
                        },
                        onError: (e) => {
                          alert(
                            e.message || 'No se pudo guardar el diagnóstico',
                          );
                        },
                      },
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
                >
                  {createDiagnosis.isPending
                    ? 'Guardando…'
                    : 'Guardar y continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Órdenes */}
      {activeTab === 'ordenes' && (
        <div className="max-w-4xl">
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6 space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select
                value={orderDraft.type}
                onChange={(e) =>
                  setOrderDraft((o) => ({ ...o, type: e.target.value as any }))
                }
                className={inputClass}
              >
                <option value="lab">Laboratorio</option>
                <option value="imaging">Imágenes</option>
              </select>
              <input
                placeholder="Código (opcional)"
                value={orderDraft.code ?? ''}
                onChange={(e) =>
                  setOrderDraft((o) => ({ ...o, code: e.target.value }))
                }
                className={inputClass}
              />
              <input
                placeholder="Nombre del estudio"
                value={orderDraft.label}
                onChange={(e) =>
                  setOrderDraft((o) => ({ ...o, label: e.target.value }))
                }
                className={inputClass}
              />
              <select
                value={orderDraft.priority ?? ''}
                onChange={(e) =>
                  setOrderDraft((o) => ({
                    ...o,
                    priority: e.target.value as any,
                  }))
                }
                className={inputClass}
              >
                <option value="">Prioridad</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <textarea
              placeholder="Notas para el laboratorio"
              value={orderDraft.notes ?? ''}
              onChange={(e) =>
                setOrderDraft((o) => ({ ...o, notes: e.target.value }))
              }
              rows={3}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrders((os) => [...os, orderDraft])}
                disabled={!orderDraft.label.trim()}
                className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors disabled:opacity-60"
              >
                + Agregar orden
              </button>
              <button
                disabled={!consultationId || orders.length === 0}
                onClick={() =>
                  createOrders.mutate({
                    consultationId: consultationId!, // prisma: MedicalOrder.consultationId
                    orders,
                  })
                }
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition disabled:opacity-60"
              >
                Guardar órdenes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen (placeholder hasta conectar queries) */}
      {activeTab === 'resumen' && (
        <div className="max-w-4xl">
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6 space-y-4 text-sm">
            <p className="text-[#374151]">
              Aquí mostrarás: Motivo, Plan, Recetas, Diagnósticos estructurados
              y Órdenes.
            </p>
            <p className="text-xs text-gray-500">
              Luego conectamos queries para traer datos reales.
            </p>
          </div>
        </div>
      )}

      {/* Footer global */}
      <div className="max-w-4xl mx-auto sticky bottom-0 mt-6 bg-white border border-[#E4E8EB] rounded-xl p-4 shadow-sm">
        <div className="flex justify-end gap-2">
          <button
            onClick={() =>
              saveDraft.mutate?.({ consultationId, partial: buildPayload() })
            }
            className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors"
          >
            Guardar borrador
          </button>
          <button
            disabled={!consultationId || closeConsultation.isPending}
            onClick={() =>
              closeConsultation.mutate({
                consultationId: consultationId!, // prisma: Consultation.status -> completed, closedAt now
                completeAppointment:
                  typeof appointmentId === 'string' ? appointmentId : undefined, // opcional
              })
            }
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
          >
            Cerrar atención
          </button>
        </div>
      </div>
    </Layout>
  );
}
