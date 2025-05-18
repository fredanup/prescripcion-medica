import { useSession } from 'next-auth/react';
import Image from 'next/image';

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
  const { data: users } = trpc.user.findPatients.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  if (!session?.user) return null;

  return (
    <>
      <Layout>
        <FormTitle text={'Pacientes'} />
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
              {users?.map((user, index) => (
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
                      Editar
                    </button>
                    <button
                      className="rounded-md border font-medium border-pink-500 text-pink-500 mr-4 py-2 px-4 hover:bg-pink-500 hover:text-white transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      Eliminar
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
