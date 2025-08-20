import { useMemo } from 'react';
import Image from 'next/image';
import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';
import Spinner from 'utilities/spinner';
import { trpc } from 'utils/trpc';

const card = 'bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6';
const badge =
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border bg-[#F7F7F8] text-[#374151] border-[#E4E8EB]';
const btnGhost =
  'px-3 py-2 rounded-lg bg-[#F7F7F8] border border-[#E4E8EB] text-sm font-medium text-[#374151] hover:bg-white transition-colors disabled:opacity-60';
const btnPrimary =
  'px-3 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60';

export default function History() {
  // Trae el historial del paciente logueado
  const { data, isLoading, error, refetch } =
    trpc.consultation.findPatientHistory.useQuery();

  // Helper para formatear fecha/hora en es-PE
  const f = (d: string | Date) =>
    new Date(d).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Lima',
    });

  const items = useMemo(() => data ?? [], [data]);

  // Utilidad tRPC para invocar getPrescriptionBundle bajo demanda (sin N consultas)
  const utils = trpc.useContext();

  return (
    <Layout>
      <div className="mb-4">
        <FormTitle text="Mi Historial Clínico" />
        <p className="text-sm text-gray-500 mt-1">
          Revisa tus atenciones, recetas e indicaciones. Puedes descargar tu
          receta o compartirla con farmacia.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-16">
          <Spinner text="Cargando historial" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className={`${card}`}>
          <p className="text-sm text-red-600">
            No se pudo cargar el historial. Intenta nuevamente.
          </p>
          <div className="mt-3">
            <button onClick={() => refetch()} className={btnGhost}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className={`${card} text-center`}>
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#F7F7F8] border border-[#E4E8EB] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-gray-400"
              fill="currentColor"
            >
              <path d="M5 4h14a1 1 0 0 1 1 1v13l-4-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#374151]">
            Aún no tienes atenciones
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cuando tengas consultas registradas aparecerán aquí.
          </p>
        </div>
      )}

      {/* Lista de consultas */}
      <div className="space-y-6">
        {items.map((c) => (
          <div key={c.id} className={card}>
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                {c.doctor?.user?.image ? (
                  <Image
                    src={c.doctor.user.image}
                    alt="Doctor"
                    width={48}
                    height={48}
                    className="rounded-full border border-[#E4E8EB]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#F7F7F8] border border-[#E4E8EB]" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Consulta con</p>
                  <p className="text-base font-semibold text-[#374151]">
                    Dr. {c.doctor?.user?.name} {c.doctor?.user?.lastName}
                  </p>
                  {!!c.appointment?.specialty?.name && (
                    <span className={`${badge} mt-1`}>
                      {c.appointment.specialty.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Fecha y hora</p>
                <p className="text-sm font-medium text-[#374151]">
                  {f(c.date)}
                </p>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <h4 className="text-sm font-semibold text-[#374151] mb-1">
                  Motivo
                </h4>
                <p className="text-sm text-[#374151]">{c.reason}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#374151] mb-1">
                  Diagnóstico
                </h4>
                <p className="text-sm text-[#374151]">{c.diagnosis || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#374151] mb-1">
                  Plan
                </h4>
                <p className="text-sm text-[#374151]">{c.plan || '-'}</p>
              </div>
            </div>

            {/* Indicaciones */}
            {c.indications?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-[#374151] mb-1">
                  Indicaciones
                </h4>
                <ul className="list-disc pl-5 text-sm text-[#374151] space-y-1">
                  {c.indications.map((ind: any) => (
                    <li key={ind.id}>
                      <span className="font-medium">{ind.instruction}</span>
                      {ind.notes ? ` — ${ind.notes}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recetas */}
            {c.prescriptions?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-[#374151] mb-1">
                  Recetas
                </h4>
                <div className="overflow-x-auto border border-[#E4E8EB] rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7F7F8] border-b border-[#E4E8EB] text-left">
                      <tr>
                        <th className="py-2 px-3">Medicamento</th>
                        <th className="py-2 px-3">Dosis</th>
                        <th className="py-2 px-3">Frecuencia</th>
                        <th className="py-2 px-3">Duración</th>
                        <th className="py-2 px-3">Vía</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.prescriptions.map((rx: any) => (
                        <tr key={rx.id} className="border-b border-[#E4E8EB]">
                          <td className="py-2 px-3">{rx.medication}</td>
                          <td className="py-2 px-3">{rx.dosage}</td>
                          <td className="py-2 px-3">{rx.frequency}</td>
                          <td className="py-2 px-3">{rx.duration}</td>
                          <td className="py-2 px-3">{rx.route}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-[#E4E8EB] flex flex-wrap items-center justify-end gap-2">
              <a
                href={`/api/pdf/prescription?consultationId=${c.id}`}
                target="_blank"
                rel="noreferrer"
                className={btnGhost}
              >
                Descargar/Imprimir receta
              </a>

              <button
                className={btnPrimary}
                onClick={async () => {
                  // Llamada puntual sin múltiples renders: usa el helper de tRPC context
                  const bundle =
                    await utils.consultation.getPrescriptionBundle.fetch({
                      consultationId: c.id,
                    });
                  const url = bundle?.url; // compatibilidad
                  if (url) {
                    await navigator.clipboard.writeText(url);
                    alert('Link de farmacia copiado al portapapeles');
                  } else {
                    alert('No se pudo generar el link. Intente nuevamente.');
                  }
                }}
              >
                Copiar link para farmacia
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
