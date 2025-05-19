import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';

import { trpc } from 'utils/trpc';

export default function Patients() {
  //Obtenemos la sesión de la bd
  const { data: session, status } = useSession();

  /**
   * Consultas a base de datos
   */
  //Obtener todos los usuarios creados con su sucursal
  const { data: patients } = trpc.user.findPatients.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  //Hook de estado que almacena el valor de búsqueda
  const [search, setSearch] = useState('');

  const filteredPatients = patients?.filter((user) => {
    return user.name?.toLowerCase().includes(search.toLowerCase());
  });

  if (!session?.user) return null;

  return (
    <>
      <Layout>
        <FormTitle text={'Pacientes'} />
        <div className="my-4">
          <input
            type="text"
            placeholder="Ingrese paciente a buscar..."
            className="w-full bg-[#F7F7F8] border border-[#E4E8EB] text-sm text-gray-700 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 transition-shadow"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            required
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-200 text-left text-black text-sm font-light">
              <tr>
                <th className="py-4 pr-2">Paciente</th>

                <th className="py-4 pr-2">Sucursal</th>
                <th className="py-4 pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients?.map((user, index) => (
                <tr
                  className="border-b border-gray-200 text-sm font-light"
                  key={index}
                >
                  <td className="py-4 pr-2 flex flex-row gap-3 items-center text-sm font-light">
                    <Image
                      className="rounded-full"
                      width={50}
                      height={50}
                      src={user.image ?? ''}
                      alt="User Avatar"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {user.name} {user.lastName}
                      </p>
                      <p className="font-light text-xs">{user.email}</p>
                    </div>
                  </td>

                  <td className="py-4 pr-2">{user.Branch?.name}</td>
                  <td className="py-4">
                    <button
                      className="rounded-md border font-medium border-sky-500 text-sky-500 mr-4 py-2 px-4 hover:bg-sky-500 hover:text-white transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>
    </>
  );
}
