import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import CreateDocumentModal from 'pages/modals/create-document-modal';
import UnvalidDocument from 'pages/modals/unvalid-document';

import { useEffect, useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import Spinner from 'utilities/spinner';
import { trpc } from 'utils/trpc';

export default function Profile() {
  /**
   * Declaraciones de hooks de estado
   */
  //Hook de estado que controla la apertura del modal de creación de documentos

  const [isOpen, setIsOpen] = useState(false);
  const [isUnavailableDoc, setIsUnavailableDoc] = useState(false);
  const [userId, setUserId] = useState('');
  //Obtener el usuario actual
  const { data: session, status } = useSession();

  const [docType, setDoctype] = useState('');

  //Redireccion al usuario a Main
  useEffect(() => {
    if (session) {
      if (status === 'authenticated') {
        setUserId(session.user!.id);
      } else {
        <Spinner text={status} />;
      }
    } else {
      <Spinner text={status} />;
    }
  }, [status, session]);
  /**
   * Consultas a base de datos
   */
  //Obtener los registros de bd
  const { data } = trpc.document.getUserDocuments.useQuery(
    { userId }, // Pasa userId directamente como parte del objeto de entrada
    {
      enabled: !!userId, // La consulta se habilita solo si userId tiene un valor truthy
    },
  );
  const { data: currentUser } = trpc.user.findCurrentOne.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  /**
   * Funciones de apertura y cierre de modales
   */
  //Función de apertura del modal DocumentModal
  const openModal = (opt: string) => {
    setIsOpen(true);
    setDoctype(opt);
  };
  //Función de cierre del modal DocumentModal
  const closeModal = () => {
    setIsOpen(false);
    setDoctype('');
  };

  const openUnavailableDocModal = () => {
    setIsUnavailableDoc(true);
  };
  //Función de cierre del modal DocumentModal
  const closeUnavailableDocModalModal = () => {
    setIsUnavailableDoc(false);
  };

  const urlDoc = (doc: string, userId: string) => {
    const founded = data?.find((record) => record.key === doc);
    if (founded !== undefined) {
      // Reemplaza todos los espacios por + en la key
      const formattedKey = founded.key?.replace(/ /g, '+');
      return `https://pacificsecurity.s3.amazonaws.com/documents/${userId}/${formattedKey}`;
    } else {
      return null;
    }
  };

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
                {currentUser?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Género</p>
              <p className="text-sm font-medium text-black ">Masculino</p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Fecha de nacimiento
              </p>
              <p className="text-sm font-medium text-black ">30/06/1996</p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Edad</p>
              <p className="text-sm font-medium text-black ">32</p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">Teléfono</p>
              <p className="text-sm font-medium text-black ">986814715</p>
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
                Urb. Santa Rosa, Calle 1 Mz. 2 Lote 3
              </p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Tipo de sangre
              </p>
              <p className="text-sm font-medium text-black ">O+</p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">
                Estatus marital
              </p>
              <p className="text-sm font-medium text-black ">Soltero</p>
            </div>
            <div>
              <p className="text-sm font-normal text-gray-500 mb-1">DNI</p>
              <p className="text-sm font-medium text-black ">73089093</p>
            </div>
          </div>
        </div>
        <CreateDocumentModal
          isOpen={isOpen}
          onClose={closeModal}
          opt={docType}
        />
        <UnvalidDocument
          isOpen={isUnavailableDoc}
          onClose={closeUnavailableDocModalModal}
        />
      </Layout>
    </>
  );
}
