import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/router';
import { trpc } from 'utils/trpc';
import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';
import { Toast } from 'utilities/toast';
import { BlockingLoader } from 'utilities/bloackingLoader';

type Prescription = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
};

// Tipos locales para payloads nuevos
type DiagnosisItem = {
  id: string; // Para manejar edición/remoción en UI
  code?: string;
  label: string;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
};

type OrderItem = {
  id: string; // Para claves estables y remover por fila
  type: 'lab' | 'imaging';
  code?: string;
  label: string;
  priority?: 'normal' | 'urgent';
  notes?: string;
};

const makeId = () =>
  `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function ConsultationForm() {
  const router = useRouter();

  const { id: appointmentId } = router.query;

  const utils = trpc.useContext();

  // Guardamos el id de la consulta creada para enlazar diagnóstico/órdenes
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const {
    mutateAsync: createConsultation,
    isPending: isCreatingConsultation,
    error: mutationError,
  } = trpc.consultation.create.useMutation({
    onSuccess: async (created) => {
      if (created?.id) setConsultationId(created.id);
      await utils.appointment.findDoctorAppointmentsByDate.invalidate();
      // No redirigimos aún; seguimos con diagnóstico/órdenes
    },
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'consulta' | 'diagnostico' | 'ordenes' | 'resumen'
  >('consulta');

  // Mutations nuevas según schema
  const closeConsultation = trpc.consultation.close.useMutation();
  const saveDraft = trpc.consultation.saveDraft.useMutation();
  const createDiagnosis = trpc.consultation.createDiagnosis.useMutation({
    onSuccess: async () => {
      await utils.consultation.getSummary.invalidate();
    },
  });
  const createOrders = trpc.consultation.createOrders.useMutation({
    onSuccess: async () => {
      await utils.consultation.getSummary.invalidate();
    },
  });
  const summary = trpc.consultation.getSummary.useQuery(
    { consultationId: consultationId ?? '' },
    { enabled: !!consultationId },
  );

  // Estado original
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState(''); // libre (se mantiene)
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { medication: '', dosage: '', frequency: '', duration: '', route: '' },
  ]);

  // arriba, junto con otros useState
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const [toastMsg, setToastMsg] = useState('');

  // Estado para nuevos tabs
  const [dxItems, setDxItems] = useState<DiagnosisItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: makeId(),
      type: 'lab',
      code: '',
      label: '',
      priority: 'normal',
      notes: '',
    },
  ]);

  // Helpers Órdenes
  const addOrderRow = () =>
    setOrders((prev) => [
      ...prev,
      {
        id: makeId(),
        type: 'lab',
        code: '',
        label: '',
        priority: 'normal',
        notes: '',
      },
    ]);

  const removeOrderRow = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  const updateOrderField = <K extends keyof OrderItem>(
    idx: number,
    key: K,
    value: OrderItem[K],
  ) =>
    setOrders((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });

  const canSaveOrders =
    !!consultationId &&
    orders.length > 0 &&
    orders.every((o) => o.label.trim().length > 0);

  // Helpers Diagnóstico
  const addDx = () =>
    setDxItems((prev) => [...prev, { id: makeId(), label: '' }]);
  const removeDx = (id: string) =>
    setDxItems((prev) => prev.filter((d) => d.id !== id));

  const canSaveDx =
    !!consultationId &&
    dxItems.length > 0 &&
    dxItems.every((d) => d.label.trim().length > 0);

  const fmt = (d?: string | Date | null) =>
    d
      ? new Date(d).toLocaleString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

  // Estilos base
  const inputClass =
    'w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow';

  // Recetas
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
        setConsultationId(result.id);
        setActiveTab('diagnostico'); // siguiente paso
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
                          disabled={isCreatingConsultation}
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
                  disabled={isCreatingConsultation}
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
                disabled={isCreatingConsultation}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled={isCreatingConsultation}
              >
                {isCreatingConsultation ? 'Guardando…' : 'Guardar consulta'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Diagnóstico (estructurado) */}
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
                    // ¡Importante! No enviar id local del front
                    createDiagnosis.mutate(
                      {
                        consultationId,
                        items: dxItems.map(({ ...rest }) => rest),
                      },
                      {
                        onSuccess: () => setActiveTab('ordenes'),
                        onError: (e) =>
                          alert(
                            e.message || 'No se pudo guardar el diagnóstico',
                          ),
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
            {!consultationId && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs text-yellow-800">
                Primero guarda la <strong>Consulta</strong> para generar el ID
                de consulta.
              </div>
            )}

            {/* Lista editable al estilo "Recetas" */}
            <div className="space-y-2">
              {orders.map((o, idx) => (
                <div
                  key={o.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start"
                >
                  {/* Tipo */}
                  <select
                    value={o.type}
                    onChange={(e) =>
                      updateOrderField(
                        idx,
                        'type',
                        e.target.value as 'lab' | 'imaging',
                      )
                    }
                    className={inputClass}
                  >
                    <option value="lab">Laboratorio</option>
                    <option value="imaging">Imágenes</option>
                  </select>

                  {/* Código (opcional) */}
                  <input
                    placeholder="Código"
                    value={o.code ?? ''}
                    onChange={(e) =>
                      updateOrderField(idx, 'code', e.target.value)
                    }
                    className={inputClass}
                  />

                  {/* Nombre del estudio */}
                  <input
                    placeholder="Nombre del estudio*"
                    value={o.label}
                    onChange={(e) =>
                      updateOrderField(idx, 'label', e.target.value)
                    }
                    required
                    className={inputClass}
                  />

                  {/* Prioridad */}
                  <select
                    value={o.priority ?? 'normal'}
                    onChange={(e) =>
                      updateOrderField(
                        idx,
                        'priority',
                        e.target.value as 'normal' | 'urgent',
                      )
                    }
                    className={inputClass}
                  >
                    <option value="normal">Prioridad: Normal</option>
                    <option value="urgent">Prioridad: Urgente</option>
                  </select>

                  {/* Notas */}
                  <input
                    placeholder="Notas (opcional)"
                    value={o.notes ?? ''}
                    onChange={(e) =>
                      updateOrderField(idx, 'notes', e.target.value)
                    }
                    className={inputClass}
                  />

                  {/* Acciones por fila */}
                  <div className="md:col-span-5">
                    {orders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderRow(o.id)}
                        className="mt-1 px-3 py-1 rounded bg-[#F7F7F8] border border-[#E4E8EB] text-[#374151] text-xs hover:bg-white transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones de lista */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={addOrderRow}
                className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors"
              >
                + Agregar orden
              </button>

              <button
                type="button"
                disabled={!canSaveOrders || createOrders.isPending}
                onClick={() => {
                  if (!consultationId) return;
                  // Enviamos TODAS las órdenes de la tabla (no limpiamos nada)
                  createOrders.mutate(
                    {
                      consultationId,
                      orders: orders.map(({ ...o }) => ({
                        type: o.type,
                        code: o.code || undefined,
                        label: o.label,
                        priority: o.priority ?? 'normal',
                        notes: o.notes || undefined,
                      })),
                    },
                    {
                      onSuccess: () => setActiveTab('resumen'),
                      onError: (e) =>
                        alert(
                          e.message || 'No se pudieron guardar las órdenes.',
                        ),
                    },
                  );
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
              >
                {createOrders.isPending ? 'Guardando…' : 'Guardar órdenes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen (placeholder hasta conectar queries) */}
      {activeTab === 'resumen' && (
        <div className="max-w-4xl">
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6 space-y-6 text-sm">
            {!consultationId && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs text-yellow-800">
                Primero guarda la <strong>Consulta</strong> para generar el ID y
                ver el resumen.
              </div>
            )}

            {consultationId && summary.isLoading && (
              <div className="text-sm text-gray-500">Cargando resumen…</div>
            )}

            {consultationId && summary.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <p className="font-semibold mb-1">
                  No se pudo cargar el resumen
                </p>
                <p>{(summary.error as any)?.message ?? 'Error desconocido'}</p>
              </div>
            )}

            {consultationId && summary.data && (
              <>
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#111827]">
                      Resumen de atención
                    </h3>
                    <p className="text-xs text-gray-500">
                      Consulta #{summary.data.id} · {fmt(summary.data.date)}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {summary.data.appointment?.specialty?.name ? (
                      <>
                        Especialidad:{' '}
                        <span className="font-medium text-[#374151]">
                          {summary.data.appointment.specialty.name}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Paciente / Doctor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Paciente</p>
                    <p className="text-sm font-medium text-[#374151]">
                      {summary.data.patient?.user?.name}{' '}
                      {summary.data.patient?.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {summary.data.patient?.user?.email ?? '—'}
                    </p>
                  </div>
                  <div className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Médico</p>
                    <p className="text-sm font-medium text-[#374151]">
                      {summary.data.doctor?.user?.name}{' '}
                      {summary.data.doctor?.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {summary.data.doctor?.user?.email ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Motivo / Plan / Notas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Motivo</p>
                    <div className="bg-white border border-[#E4E8EB] rounded-xl p-3">
                      <p className="text-sm text-[#374151] whitespace-pre-wrap">
                        {summary.data.reason || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Plan</p>
                    <div className="bg-white border border-[#E4E8EB] rounded-xl p-3">
                      <p className="text-sm text-[#374151] whitespace-pre-wrap">
                        {summary.data.plan || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Notas</p>
                    <div className="bg-white border border-[#E4E8EB] rounded-xl p-3">
                      <p className="text-sm text-[#374151] whitespace-pre-wrap">
                        {summary.data.notes || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico estructurado */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Diagnóstico(s) estructurado(s)
                  </p>
                  {summary.data.consultationDiagnosis?.length ? (
                    <div className="space-y-2">
                      {summary.data.consultationDiagnosis.map((d) => (
                        <div
                          key={d.id}
                          className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-3"
                        >
                          <p className="text-sm text-[#111827] font-medium">
                            {d.label}{' '}
                            {d.code ? (
                              <span className="text-gray-500 font-normal">
                                ({d.code})
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-gray-500">
                            {d.severity ? `Severidad: ${d.severity}` : '—'}
                            {d.notes ? ` · Notas: ${d.notes}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Sin diagnósticos estructurados.
                    </p>
                  )}
                </div>

                {/* Indicaciones */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Indicaciones</p>
                  {summary.data.indications?.length ? (
                    <ul className="space-y-2">
                      {summary.data.indications.map((i) => (
                        <li
                          key={i.id}
                          className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-3"
                        >
                          <p className="text-sm text-[#374151]">
                            {i.instruction}
                          </p>
                          {i.notes && (
                            <p className="text-xs text-gray-500">
                              Notas: {i.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Sin indicaciones registradas.
                    </p>
                  )}
                </div>

                {/* Recetas */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recetas</p>
                  {summary.data.prescriptions?.length ? (
                    <div className="space-y-2">
                      {summary.data.prescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-3"
                        >
                          <p className="text-sm text-[#111827] font-medium">
                            {rx.medication}
                          </p>
                          <p className="text-xs text-gray-500">
                            {[
                              rx.dosage && `Dosis: ${rx.dosage}`,
                              rx.frequency && `Frec.: ${rx.frequency}`,
                              rx.duration && `Duración: ${rx.duration}`,
                              rx.route && `Vía: ${rx.route}`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {rx.dispensed && (
                            <p className="text-xs text-green-700 mt-1">
                              Dispensado {fmt(rx.dispensedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin recetas.</p>
                  )}
                </div>

                {/* Órdenes médicas */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Órdenes médicas</p>
                  {summary.data.medicalOrders?.length ? (
                    <div className="space-y-2">
                      {summary.data.medicalOrders.map((o) => (
                        <div
                          key={o.id}
                          className="bg-[#F7F7F8] border border-[#E4E8EB] rounded-xl p-3"
                        >
                          <p className="text-sm text-[#111827] font-medium">
                            {o.area === 'laboratory'
                              ? 'Laboratorio'
                              : 'Imágenes'}{' '}
                            · {o.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Estado: {o.status}
                            {o.priority ? ` · Prioridad: ${o.priority}` : ''}
                          </p>
                          {o.results && (
                            <p className="text-xs text-[#374151] mt-1 whitespace-pre-wrap">
                              Resultado: {o.results}
                            </p>
                          )}
                          {o.resultFile && (
                            <a
                              href={o.resultFile}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] underline mt-1 inline-block"
                            >
                              Ver archivo adjunto
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Sin órdenes creadas.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer global */}
      <div className="max-w-4xl mx-auto sticky bottom-0 mt-6 bg-white border border-[#E4E8EB] rounded-xl p-4 shadow-sm">
        <div className="flex justify-end gap-2">
          <button
            onClick={() =>
              saveDraft.mutate({ consultationId, partial: buildPayload() })
            }
            className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors"
          >
            Guardar borrador
          </button>
          <button
            disabled={!consultationId || closeConsultation.isPending}
            onClick={() =>
              closeConsultation.mutate(
                {
                  consultationId: consultationId!,
                  completeAppointment:
                    typeof appointmentId === 'string'
                      ? appointmentId
                      : undefined,
                },
                {
                  onSuccess: async () => {
                    // 1) Invalida el resumen y/o listados relevantes
                    await Promise.allSettled([
                      utils.consultation.getSummary.invalidate({
                        consultationId: consultationId!,
                      }),
                      utils.appointment.findDoctorAppointmentsByDate.invalidate(),
                      utils.appointment.findMyAppointments.invalidate(),
                    ]);

                    // 2) Toast y transición
                    setToastType('success');
                    setToastMsg('Atención cerrada correctamente.');
                    setToastOpen(true);

                    // 3) Opciones de navegación:
                    // a) volver a “Resumen” y forzar refetch visible:
                    // setActiveTab('resumen');
                    // si tienes summary hook:
                    // summary.refetch?.();

                    // b) O navegar a /dashboard/callings (descomenta si prefieres salir)
                    setTimeout(() => {
                      router.push('/dashboard/callings'); // o la ruta de tu agenda
                    }, 1500);
                  },
                  onError: (e) => {
                    setToastType('error');
                    setToastMsg(e.message || 'No se pudo cerrar la atención.');
                    setToastOpen(true);
                  },
                },
              )
            }
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
          >
            {closeConsultation.isPending ? 'Cerrando…' : 'Cerrar atención'}
          </button>
        </div>
      </div>
      {/* Overlay cuando cierra */}
      <BlockingLoader
        show={closeConsultation.isPending}
        text="Cerrando atención…"
      />

      {/* Toast */}
      <Toast
        open={toastOpen}
        type={toastType}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </Layout>
  );
}
