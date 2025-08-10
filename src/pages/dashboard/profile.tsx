import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useMemo } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import Spinner from 'utilities/spinner';
import { trpc } from 'utils/trpc';

function getInitials(name?: string | null, lastName?: string | null) {
  const n = (name ?? '').trim().split(' ')[0];
  const l = (lastName ?? '').trim().split(' ')[0];
  const i1 = n ? n[0] : '';
  const i2 = l ? l[0] : '';
  return (i1 + i2 || 'U').toUpperCase();
}

function Avatar({
  src,
  name,
  lastName,
}: {
  src?: string | null;
  name?: string | null;
  lastName?: string | null;
}) {
  if (src) {
    return (
      <Image
        className="rounded-full border-4 border-[#E4E8EB] shadow-sm"
        src={src}
        width={96}
        height={96}
        alt="Foto de perfil"
      />
    );
  }
  return (
    <div className="h-24 w-24 rounded-full bg-[#F7F7F8] text-[#2563EB] flex items-center justify-center text-lg font-semibold border-4 border-[#E4E8EB] shadow-sm">
      {getInitials(name, lastName)}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm font-medium text-[#374151]">{value ?? '-'}</p>
    </div>
  );
}

export default function Profile() {
  // 1) SIEMPRE llamar hooks en el tope
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';

  // Hook siempre invocado; el fetch sólo corre si isAuthed === true
  const { data: currentUser, isLoading } = trpc.user.findCurrentOne.useQuery(
    undefined,
    { enabled: isAuthed },
  );

  const birthday = useMemo(() => {
    if (!currentUser?.birthDate) return undefined;
    try {
      return new Date(currentUser.birthDate).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return undefined;
    }
  }, [currentUser?.birthDate]);

  // 2) Render único (opcional pero limpio). Nada de returns antes de hooks.
  return (
    <Layout>
      <FormTitle text="Perfil" />

      {/* Loading de sesión */}
      {status === 'loading' && (
        <div className="py-10">
          <Spinner text="Cargando sesión…" />
        </div>
      )}

      {/* Sin sesión (ruta pública o proteger con middleware/guard) */}
      {status !== 'loading' && !session && (
        <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">No has iniciado sesión.</p>
        </div>
      )}

      {/* Contenido principal para autenticados */}
      {isAuthed && (
        <div className="space-y-6">
          {/* Card principal */}
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6">
            {isLoading ? (
              // Skeleton
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-[#F7F7F8] animate-pulse" />
                <div className="flex-1 w-full space-y-2">
                  <div className="h-5 w-48 bg-[#F7F7F8] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-[#F7F7F8] rounded animate-pulse" />
                  <div className="h-3 w-64 bg-[#F7F7F8] rounded animate-pulse" />
                  <div className="h-3 w-40 bg-[#F7F7F8] rounded animate-pulse" />
                </div>
              </div>
            ) : !currentUser ? (
              // Empty state
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#F7F7F8] flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-[#2563EB]"
                    fill="currentColor"
                  >
                    <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-[#374151]">
                  No se encontró información de usuario
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vuelve a intentarlo en unos segundos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar
                  src={currentUser.image}
                  name={currentUser.name}
                  lastName={currentUser.lastName}
                />
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-[#374151]">
                    {currentUser.name} {currentUser.lastName}
                  </h2>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border bg-[#F7F7F8] text-[#2563EB] border-[#E4E8EB]">
                      Usuario activo
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentUser.email}
                  </p>
                  <p className="text-sm text-gray-500">{currentUser.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Información Personal */}
          <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm p-6">
            <h4 className="text-sm font-semibold text-[#374151] mb-4 border-b border-[#E4E8EB] pb-2">
              Información personal
            </h4>

            {isLoading ? (
              // Skeleton grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-28 bg-[#F7F7F8] rounded animate-pulse" />
                    <div className="h-4 w-48 bg-[#F7F7F8] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow label="Nombres" value={currentUser?.name} />
                <InfoRow label="Apellidos" value={currentUser?.lastName} />
                <InfoRow label="Fecha de nacimiento" value={birthday} />
                <InfoRow label="Teléfono" value={currentUser?.phone} />
                <InfoRow label="Correo" value={currentUser?.email} />
                <InfoRow label="Dirección" value={currentUser?.address} />
                <InfoRow
                  label="Estatus marital"
                  value={currentUser?.maritalStatus}
                />
                <InfoRow label="DNI" value={currentUser?.documentNumber} />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
