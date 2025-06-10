import { useSession } from 'next-auth/react';
import Image from 'next/image';

import { useEffect } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import Spinner from 'utilities/spinner';
import { trpc } from 'utils/trpc';

export default function Profile() {
  /**
   * Declaraciones de hooks de estado
   */
  //Hook de estado que controla la apertura del modal de creación de documentos

  //Obtener el usuario actual
  const { data: session, status } = useSession();

  //Redireccion al usuario a Main
  useEffect(() => {
    if (session) {
      if (!(status === 'authenticated')) {
        <Spinner text={status} />;
      }
    } else {
      <Spinner text={status} />;
    }
  }, [status, session]);
  /**
   * Consultas a base de datos
   */

  const { data: currentUser } = trpc.user.findCurrentOne.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  return (
    <>
      <Layout>
        <FormTitle text="Perfil" />
        <div className="flex flex-col gap-4 w-full h-full">
          {/*Foto y datos personales*/}
          <div className="flex flex-col items-center py-2 ">
            <Image
              className="rounded-full"
              src={currentUser?.image || '/avatar.png'}
              width={95}
              height={100}
              alt="Logo"
            />
            <p className="text-m text-base font-medium text-gray-700">
              {currentUser?.name}
            </p>
            <div className="flex flex-row gap-2 items-center">
              <p className="text-sm font-normal text-gray-500">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <h3 className="text-black text-base font-bold">Datos personales</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Nombres</p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Apellidos
              </p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Fecha de nacimiento
              </p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.birthDate?.toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Teléfono</p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.phone}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Correo</p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Dirección
              </p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.address}
              </p>
            </div>

            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Estatus marital
              </p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.maritalStatus}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">DNI</p>
              <p className="text-sm font-medium text-black ">
                {currentUser?.documentNumber}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
