import { useEffect, useMemo, useState } from 'react';
import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';
import Image from 'next/image';
import { trpc } from 'utils/trpc';
import { getOrderStatusLabel } from 'utils/orderStatusLabel';

// —— estilos
const box = 'bg-white border border-[#E4E8EB] rounded-xl shadow-sm';
const input =
  'w-full bg-[#F7F7F8] border border-[#E4E8EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-gray-300';

// —— tipos (alineados al .output() del router)
type ConsultationItem = {
  kind: 'consultation';
  id: string;
  date: Date;
  data: any;
};
type OrderItem = { kind: 'order'; id: string; date: Date; data: any };
type Item = ConsultationItem | OrderItem;

export default function ClinicalHistory() {
  const { data: patients, isLoading: loadingPatients } =
    trpc.clinicalHistory.listMyPatients.useQuery();

  const [selected, setSelected] = useState<string | null>(null);

  // useInfiniteQuery para timeline: el cursor lo maneja React Query
  const {
    data: timeline,
    isFetching: loadingTimeline,
    hasNextPage,
    fetchNextPage,
    refetch: refetchTimeline,
  } = trpc.clinicalHistory.timeline.useInfiniteQuery(
    // input base (sin cursor)
    { patientId: selected ?? '', limit: 20 },
    {
      enabled: !!selected,
      // cómo obtener el siguiente cursor desde cada "page"
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  // aplanar páginas -> items[]
  const items: Item[] = useMemo(
    () => timeline?.pages.flatMap((p) => p.items as Item[]) ?? [],
    [timeline],
  );

  // al cambiar de paciente, limpiar la caché visual y refetch
  useEffect(() => {
    if (!selected) return;
    // fuerza un refetch de la primera página del nuevo paciente
    refetchTimeline();
  }, [selected, refetchTimeline]);

  const selectedPatient = useMemo(
    () => patients?.find((p) => p.id === selected),
    [patients, selected],
  );

  return (
    <Layout>
      <FormTitle text="Historial clínico" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Columna izquierda: Pacientes */}
        <div className={`md:col-span-4 p-4 ${box} space-y-3`}>
          <div className="flex items-center gap-2">
            <input placeholder="Buscar paciente…" className={input} />
          </div>

          <div className="max-h-[70vh] overflow-auto space-y-2">
            {loadingPatients && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#E4E8EB] border-t-[#2563EB] animate-spin" />
                Cargando pacientes…
              </div>
            )}
            {!loadingPatients && (patients?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-500">Sin pacientes aún.</p>
            )}
            {patients?.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selected === p.id
                    ? 'border-[#2563EB] bg-[#F7F7F8]'
                    : 'border-[#E4E8EB] hover:bg-[#F7F7F8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#F7F7F8] border border-[#E4E8EB]" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#374151]">
                      {p.name} {p.lastName}
                    </p>
                    {p.lastContactAt && (
                      <p className="text-xs text-gray-500">
                        Último contacto:{' '}
                        {new Date(p.lastContactAt).toLocaleDateString('es-PE')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Timeline */}
        <div className={`md:col-span-8 p-4 ${box} space-y-4`}>
          {!selected && (
            <div className="text-sm text-gray-500">
              Selecciona un paciente para ver su historial.
            </div>
          )}
          {selected && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Paciente</p>
                  <p className="text-lg font-semibold text-[#374151]">
                    {selectedPatient?.name} {selectedPatient?.lastName}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((it) => (
                  <TimelineCard key={`${it.kind}-${it.id}`} item={it} />
                ))}

                {loadingTimeline && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#E4E8EB] border-t-[#2563EB] animate-spin" />
                    Cargando…
                  </div>
                )}

                {hasNextPage && !loadingTimeline && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => fetchNextPage()}
                      className="px-4 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors"
                    >
                      Cargar más
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

// —— Tarjeta de la línea de tiempo (consulta u orden)
function TimelineCard({ item }: { item: Item }) {
  if (item.kind === 'consultation') {
    const c = item.data;
    return (
      <div className="p-4 rounded-xl border border-[#E4E8EB] bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#374151]">Consulta</p>
          <p className="text-xs text-gray-500">
            {new Date(item.date).toLocaleString('es-PE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </p>
        </div>
        <p className="text-sm text-[#374151] mt-1">
          <span className="font-medium">Motivo:</span> {c.reason}
        </p>
        {c.diagnosis && (
          <p className="text-sm text-[#374151]">
            <span className="font-medium">Dx (libre):</span> {c.diagnosis}
          </p>
        )}
        {c.consultationDiagnosis?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Diagnósticos</p>
            <ul className="list-disc pl-5 text-sm text-[#374151]">
              {c.consultationDiagnosis.map((d: any) => (
                <li key={d.id}>
                  {d.label} {d.code ? `(${d.code})` : ''}{' '}
                  {d.severity ? `- ${d.severity}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {c.prescriptions?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Recetas</p>
            <ul className="list-disc pl-5 text-sm text-[#374151]">
              {c.prescriptions.map((rx: any) => (
                <li key={rx.id}>
                  <span className="font-medium">{rx.medication}</span> —{' '}
                  {rx.dosage} {rx.frequency} {rx.duration} {rx.route}
                </li>
              ))}
            </ul>
          </div>
        )}
        {c.medicalOrders?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Órdenes</p>
            <ul className="list-disc pl-5 text-sm text-[#374151]">
              {c.medicalOrders.map((o: any) => (
                <li key={o.id}>
                  {o.area} — {o.description} ({o.status})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Orden independiente
  const o = item.data;
  return (
    <div className="p-4 rounded-xl border border-[#E4E8EB] bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#374151]">Orden</p>
        <p className="text-xs text-gray-500">
          {new Date(item.date).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </p>
      </div>
      <p className="text-sm text-[#374151]">
        <span className="font-medium">
          {o.area === 'laboratory' ? 'Laboratorio' : 'Imágenes'}
        </span>{' '}
        — {o.description}
      </p>
      <p className="text-xs text-gray-500">
        Estado: {getOrderStatusLabel(o.status)}
      </p>
      {o.results && (
        <p className="text-sm text-[#374151] mt-1">
          <span className="font-medium">Resultado:</span> {o.results}
        </p>
      )}
    </div>
  );
}
