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
          <div className="flex flex-col items-center py-4 ">
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
          <div className="py-4 border-b border-gray-200">
            <h3 className="text-black text-sm font-medium">Datos personales</h3>
            <ul className="list-disc pl-5">
              <li className="text-gray-500 text-sm">
                {currentUser?.name} {currentUser?.lastName}
              </li>
            </ul>
          </div>

          <h3 className="text-black text-sm font-medium">Expediente</h3>
          <div className="h-full w-full overflow-x-auto pb-12 md:pb-0">
            <table className="h-full w-full">
              <thead className="border-b border-gray-200 text-left text-black text-sm font-light">
                <tr>
                  <th className="py-4 pr-2">Nro.</th>
                  <th className="py-4 pr-2">Documento</th>
                  <th className="py-4 pr-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">1</td>
                  <td className="py-4 pr-2">DNI</td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
                      onClick={() => openModal('DNI')}
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>

                  <td className="py-4">
                    <Link
                      href={urlDoc('DNI', userId) ?? ''}
                      onClick={() => {
                        if (!urlDoc('DNI', userId)) openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('DNI', userId)
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }`}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('DNI', userId) ? 'fill-green-500' : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">2</td>
                  <td className="py-4 pr-2">Carné SUCAMEC</td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
                      onClick={() => openModal('Carné SUCAMEC')}
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={urlDoc('Carné SUCAMEC', userId) ?? ''}
                      onClick={() => {
                        if (!urlDoc('Carné SUCAMEC', userId))
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('Carné SUCAMEC', userId) !== null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('Carné SUCAMEC', userId)
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">3</td>

                  <td className="py-4 pr-2">Licencia para portar armas</td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
                      onClick={() => openModal('Licencia para portar armas')}
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={urlDoc('Licencia para portar armas', userId) ?? ''}
                      onClick={() => {
                        if (!urlDoc('Licencia para portar armas', userId))
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('Licencia para portar armas', userId) !== null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('Licencia para portar armas', userId)
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">4</td>
                  <td className="py-4 pr-2">
                    Antecedentes (penales, policiales y judiciales) o
                    Certificado único laboral
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
                      onClick={() =>
                        openModal('Antecedentes o Certificado único laboral')
                      }
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={
                        urlDoc(
                          'Antecedentes o Certificado único laboral',
                          userId,
                        ) ?? ''
                      }
                      onClick={() => {
                        if (
                          !urlDoc(
                            'Antecedentes o Certificado único laboral',
                            userId,
                          )
                        )
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc(
                            'Antecedentes o Certificado único laboral',
                            userId,
                          ) !== null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc(
                          'Antecedentes o Certificado único laboral',
                          userId,
                        )
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">5</td>
                  <td className="py-4 pr-2">
                    Certificado físico y psicológico
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5`}
                      onClick={() =>
                        openModal('Certificado físico y psicológico')
                      }
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={
                        urlDoc('Certificado físico y psicológico', userId) ?? ''
                      }
                      onClick={() => {
                        if (!urlDoc('Certificado físico y psicológico', userId))
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('Certificado físico y psicológico', userId) !==
                          null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('Certificado físico y psicológico', userId)
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">6</td>
                  <td className="py-4 pr-2">Certificado de estudios</td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5`}
                      onClick={() => openModal('Certificado de estudios')}
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={urlDoc('Certificado de estudios', userId) ?? ''}
                      onClick={() => {
                        if (!urlDoc('Certificado de estudios', userId))
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('Certificado de estudios', userId) !== null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('Certificado de estudios', userId)
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 text-sm font-light">
                  <td className="py-4 pr-2">7</td>
                  <td className="py-4 pr-2">Certificado laboral</td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 448 512"
                      className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5`}
                      onClick={() => openModal('Certificado laboral')}
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </td>
                  <td className="py-4">
                    <Link
                      href={urlDoc('Certificado laboral', userId) ?? ''}
                      onClick={() => {
                        if (!urlDoc('Certificado laboral', userId))
                          openUnavailableDocModal();
                      }}
                    >
                      <svg
                        viewBox="0 0 512 512"
                        className={`h-8 w-8 cursor-pointer  p-1.5 ${
                          urlDoc('Certificado laboral', userId) !== null
                            ? 'fill-pink-500'
                            : 'fill-gray-500'
                        }  `}
                      >
                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                      </svg>
                    </Link>
                  </td>
                  <td className="py-4 ">
                    <svg
                      viewBox="0 0 512 512"
                      className={`h-8 w-8 p-1.5 ${
                        urlDoc('Certificado laboral', userId)
                          ? 'fill-green-500'
                          : 'hidden'
                      } `}
                    >
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
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
