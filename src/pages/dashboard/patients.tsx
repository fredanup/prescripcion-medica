import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { trpc } from 'utils/trpc';

type Patient = {
  name: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  Branch?: { name?: string | null } | null;
};

function getInitials(name?: string | null, lastName?: string | null) {
  const n = (name ?? '').trim().split(' ')[0];
  const l = (lastName ?? '').trim().split(' ')[0];
  const i1 = n ? n[0] : '';
  const i2 = l ? l[0] : '';
  return `${i1}${i2}`.toUpperCase() || 'U';
}

function Avatar({ user }: { user: Patient }) {
  if (user.image) {
    return (
      <Image
        className="rounded-full"
        width={48}
        height={48}
        src={user.image}
        alt={`${user.name ?? 'Usuario'} avatar`}
      />
    );
  }
  return (
    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {getInitials(user.name, user.lastName)}
    </div>
  );
}

export default function Patients() {
  const { data: session, status } = useSession();

  const { data: patients, isLoading } = trpc.user.findPatients.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
    },
  );

  const [search] = useState('');

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((u) =>
      `${u.name ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q),
    );
  }, [patients, search]);

  if (!session?.user) return null;

  return (
    <Layout>
      <FormTitle text="Pacientes" />

      {/* Buscador */}
      <div className="my-4">
        <label htmlFor="search" className="sr-only">
          Buscar paciente
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2a8 8 0 1 1 5.292 13.708l4 4a1 1 0 0 1-1.414 1.414l-4-4A8 8 0 0 1 10 2Zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4Z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o apellido…"
            className="w-full bg-[#F7F7F8] border border-[#E4E8EB] text-sm text-gray-700 pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-shadow"
          />
        </div>
      </div>

      {/* Card tabla */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Encabezado opcional de la tabla */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Cargando lista de pacientes…'
              : `${filteredPatients.length} resultado${
                  filteredPatients.length === 1 ? '' : 's'
                }`}
          </p>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-left text-gray-700 text-sm font-semibold">
              <tr>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4 w-40">Acciones</th>
              </tr>
            </thead>

            {/* Estado cargando (skeleton simple) */}
            {isLoading && (
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-9 w-24 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}

            {/* Datos */}
            {!isLoading && filteredPatients.length > 0 && (
              <tbody className="text-sm text-gray-800">
                {filteredPatients.map((user: Patient, index: number) => (
                  <tr
                    key={index}
                    className="border-t border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="flex flex-col">
                          <p className="font-medium">
                            {user.name} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {user.Branch?.name ?? (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-4 py-2 rounded shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // navega o abre modal
                          }}
                        >
                          Ver
                        </button>
                        <button
                          className="border border-gray-300 text-gray-700 hover:bg-gray-100 transition px-4 py-2 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            // acción secundaria
                          }}
                        >
                          Opciones
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Estado vacío */}
        {!isLoading && filteredPatients.length === 0 && (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-blue-600"
                fill="currentColor"
              >
                <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm3 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              No se encontraron pacientes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Ajusta tu búsqueda o crea un nuevo paciente.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
