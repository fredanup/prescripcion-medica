import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import CreateCallingModal from 'pages/modals/create-calling-modal';
import DeleteCallingModal from 'pages/modals/delete-calling-modal';
import SuccessfulApply from 'pages/modals/successful-apply';
import UpdateDocumentModal from 'pages/modals/update-document-modal';

import { useEffect, useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import Spinner from 'utilities/spinner';
import type { IEditApplication, IEditCalling } from 'utils/auth';
import { trpc } from 'utils/trpc';

export default function Callings() {
  // Obtener la sesión de la BD
  const { status } = useSession();

  //Obtenemos la sesión de la bd
  /**
   * Consultas a base de datos
   */
  //Obtener el usuario actual
  // Consulta del usuario actual con trpc, habilitada solo si el usuario está autenticado
  const { data: currentUser, isLoading } = trpc.user.findCurrentOne.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
    },
  );

  const {
    data: applicantsOfMyCallings,
    isLoading: isLoadingCount,
    isError,
  } = trpc.application.countApplicantsOfMyCallings.useQuery();

  const [editIsOpen, setEditIsOpen] = useState(false);
  const [adviceIsOpen, setAdviceIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  const [clickedButtons, setClickedButtons] = useState<Record<string, boolean>>(
    {},
  );

  const [rol, setRole] = useState<string | undefined>(undefined);
  //Hook de estado que controla la expansión de llave angular
  const [expandedStates, setExpandedStates] = useState<boolean[]>([]);
  //Hook de estado utilizado para recordar qué card acaba de seleccionar el usuario
  /*
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );
  */
  const utils = trpc.useContext();
  const [callings, setCallings] = useState<IEditCalling[] | undefined>();

  //Hook de estado que almacena el registro seleccionado
  const [selectedCalling, setSelectedCalling] = useState<IEditCalling | null>(
    null,
  );

  // Inicialización de la ruta
  const router = useRouter();

  // Redirección basada en el usuario actual
  useEffect(() => {
    if (status === 'loading') {
      <Spinner text="Loading" />;
    } else if (status === 'unauthenticated') {
      router.replace('/').catch((error) => {
        console.error('Error al redirigir a la página principal:', error);
      });
    } else if (status === 'authenticated') {
      setRole(currentUser?.UserRole?.role);
    }
  }, [currentUser, router, status]);

  useEffect(() => {
    if (!isLoadingCount && !isError) {
      // Lógica para invalidar o actualizar datos
      utils.calling.findYourCallings.invalidate();
    }
  }, [isError, isLoadingCount, utils.calling.findYourCallings]);

  //Listar y editar deben tener atributos similares, es decir, el tipo de userCallings debe coincidir con el de IEditCalling
  const { data: userCallings } = trpc.calling.findYourCallings.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
    },
  );
  const { data: availableCallings } =
    trpc.calling.findAvailableCallings.useQuery(undefined, {
      enabled: status === 'authenticated',
    });

  const myApplications = trpc.application.findMyApplications.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
    },
  );
  const newApplication = trpc.application.createApplication.useMutation({
    onSettled: async () => {
      await utils.application.findCallApplications.invalidate();
    },
  });

  const [applications, setApplications] = useState<
    IEditApplication[] | undefined
  >();
  useEffect(() => {
    if (rol === 'patient') {
      setCallings(availableCallings);
      setApplications(myApplications.data);
    } else {
      setCallings(userCallings);
    }
  }, [availableCallings, myApplications.data, rol, userCallings]);

  useEffect(() => {
    const pairs: Record<string, boolean> = {};

    let count = 0;
    callings?.forEach((calling) => {
      const matchingApplicant = applications?.find(
        (application) => application.callingId === calling.id,
      );
      matchingApplicant ? (count = count + 1) : null;
      pairs[calling.id.toString()] = !!matchingApplicant;
      //countPairs[calling.id.toString()]=matchingApplicant?(count=count+1):(null)
    });
    setClickedButtons(pairs);
    // Si deseas actualizar algún estado o usar `pairs`, hazlo aquí.
  }, [callings, applications]);

  const openAdviceModal = () => {
    setAdviceIsOpen(true);
  };

  const closeAdviceModal = () => {
    setAdviceIsOpen(false);
  };

  //Función de selección de registro y apertura de modal de edición
  const openEditModal = (calling: IEditCalling | null) => {
    setSelectedCalling(calling);
    setEditIsOpen(true);
  };
  //Función de cierre de modal de edición
  const closeEditModal = () => {
    setEditIsOpen(false);
  };
  //Funciones para la apertura y cierre de modales de eliminación
  const openDeleteModal = (calling: IEditCalling | null) => {
    setSelectedCalling(calling);
    setDeleteIsOpen(true);
  };
  //Función de cierre de modal de edición
  const closeDeleteModal = () => {
    setDeleteIsOpen(false);
  };

  /**
   * Función para controlar la apertura y cierre de cada llave angular
   * @param index Parametro utilizado para detectar sobre qué índice del arreglo el usuario hizo clic
   */
  const handleToggle = (index: number) => {
    setExpandedStates((prevStates) => {
      //pasar los elementos de prevStates a newStates
      const newStates = [...prevStates];
      //cambia el valor de newstates de true a false y viceversa de acuerdo a qué registro se seleccionó
      newStates[index] = !newStates[index];
      //Retorno de newstates con valor cambiado
      return newStates;
    });
  };

  // Renderizado durante la carga de sesión o del usuario actual
  if (status === 'loading' || isLoading) {
    return <Spinner text="Loading" />;
  }

  const handleClick = (id: string) => {
    if (currentUser?.role === 'employer') {
      router.push({
        pathname: '/dashboard/callings/[id]',
        query: { id: id },
      });
    }
  };
  const openIsSuccessModal = () => {
    setIsSuccess(true);
  };

  const closeIsSuccessModal = () => {
    setIsSuccess(false);
  };

  const countApplicants = (callingId: string): string => {
    const result = applicantsOfMyCallings?.find(
      (applicant) => applicant.callingId === callingId,
    );

    return result && typeof result._count?._all === 'number'
      ? result._count._all.toString()
      : '0';
  };

  const handleApplyClick = (postulantId: string, callingId: string) => {
    if (currentUser?.role !== 'employer') {
      if (currentUser?.elegible) {
        if (postulantId && callingId) {
          const applicationData = {
            postulantId: postulantId,
            callingId: callingId,
          };

          newApplication.mutate(applicationData, {
            onSuccess: () => {
              // Actualizar el estado local y el texto del botón
              setClickedButtons((prevStatus) => ({
                ...prevStatus,
                [callingId]: true,
              }));
            },
          });
          openIsSuccessModal();
        } else {
          console.error('Postulant ID or Calling ID is missing');
        }
      } else {
        openAdviceModal();
      }
    }
  };

  return (
    <>
      <svg
        viewBox="0 0 512 512"
        className={`fixed bottom-20 z-10 right-8 h-12 w-12 cursor-pointer rounded-lg fill-blue-600 drop-shadow-lg md:hidden ${
          rol !== 'applicant' ? (editIsOpen ? 'hidden' : '') : 'hidden'
        }`}
        onClick={(event) => {
          event.stopPropagation();
          openEditModal(null);
        }}
      >
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
      </svg>

      <Layout>
        {/**
         * Botón para agregar nueva convocatoria
         * absolute bottom-0 right-0 h-16 w-16
         */}
        <FormTitle text="Convocatorias" />
        <div className="flex flex-row justify-between mb-4">
          <div
            className={
              rol !== 'applicant'
                ? 'hidden md:w-32 md:rounded-full md:border md:cursor-pointer md:drop-shadow-lg md:bg-blue-600 md:p-2 md:items-center md:flex md:flex-row md:gap-1 md:justify-center'
                : 'hidden'
            }
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(null);
            }}
          >
            <svg viewBox="0 0 448 512" className={`h-4 w-4 fill-white`}>
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>

            <p className="text-white text-base font-medium ">Agregar</p>
          </div>
        </div>
        <>
          {callings?.map((calling, index) => (
            <div
              className="flex flex-col gap-2 p-4 rounded-lg drop-shadow-md bg-white mb-4"
              key={index}
            >
              <div className="flex flex-row justify-between items-center">
                <h3 className="text-black text-base font-medium">
                  {calling.requirement}
                </h3>
                <div
                  className={
                    rol === 'applicant'
                      ? `cursor-pointer drop-shadow-sm items-center flex flex-row gap-2 rounded-full justify-center p-2 w-28 ${
                          clickedButtons[calling.id]
                            ? 'bg-gray-600'
                            : 'bg-blue-600'
                        }`
                      : 'items-center flex flex-row gap-4 '
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    clickedButtons[calling.id]
                      ? null
                      : handleApplyClick(currentUser!.id, calling.id);
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <svg
                      viewBox="0 0 640 512"
                      className={
                        rol === 'applicant'
                          ? `h-5 w-5 fill-white ml-4`
                          : 'hidden'
                      }
                    >
                      <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0l57.4-43c23.9-59.8 79.7-103.3 146.3-109.8l13.9-10.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176 0 384c0 35.3 28.7 64 64 64l296.2 0C335.1 417.6 320 378.5 320 336c0-5.6 .3-11.1 .8-16.6l-26.4 19.8zM640 336a144 144 0 1 0 -288 0 144 144 0 1 0 288 0zm-76.7-43.3c6.2 6.2 6.2 16.4 0 22.6l-72 72c-6.2 6.2-16.4 6.2-22.6 0l-40-40c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L480 353.4l60.7-60.7c6.2-6.2 16.4-6.2 22.6 0z" />
                    </svg>

                    <label
                      className={
                        rol === 'applicant'
                          ? `text-white text-sm font-medium cursor-pointer `
                          : 'hidden'
                      }
                    >
                      {clickedButtons[calling.id] ? 'Enviado' : 'Postular'}
                    </label>
                  </div>

                  <div className="flex flex-row gap-2 items-center ">
                    {/**Contador */}
                    <div
                      className="flex flex-row gap-2 bg-red-500 rounded-lg items-center px-2 cursor-pointer"
                      onClick={() => handleClick(calling.id)}
                    >
                      <label
                        className={
                          rol !== 'applicant'
                            ? `cursor-pointer text-white font-semibold `
                            : 'hidden'
                        }
                      >
                        {countApplicants(calling.id)}
                      </label>
                      <svg
                        viewBox="0 0 640 512"
                        className={
                          rol !== 'applicant'
                            ? `h-4 w-4 cursor-pointer fill-white`
                            : 'hidden'
                        }
                      >
                        <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM609.3 512l-137.8 0c5.4-9.4 8.6-20.3 8.6-32l0-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2l61.4 0C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                      </svg>
                    </div>

                    {/**Botón editar */}
                    <svg
                      viewBox="0 0 512 512"
                      className={
                        rol !== 'applicant'
                          ? `h-4 w-4 cursor-pointer fill-gray-500`
                          : 'hidden'
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(calling);
                      }}
                    >
                      <path d="M373.5 27.1C388.5 9.9 410.2 0 433 0c43.6 0 79 35.4 79 79c0 22.8-9.9 44.6-27.1 59.6L277.7 319l-10.3-10.3-64-64L193 234.3 373.5 27.1zM170.3 256.9l10.4 10.4 64 64 10.4 10.4-19.2 83.4c-3.9 17.1-16.9 30.7-33.8 35.4L24.4 510.3l95.4-95.4c2.6 .7 5.4 1.1 8.3 1.1c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32c0 2.9 .4 5.6 1.1 8.3L1.7 487.6 51.5 310c4.7-16.9 18.3-29.9 35.4-33.8l83.4-19.2z" />
                    </svg>
                    {/**Botón eliminar */}
                    <svg
                      viewBox="0 0 448 512"
                      className={
                        rol !== 'applicant'
                          ? `h-4 w-4 cursor-pointer fill-gray-500`
                          : 'hidden'
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        openDeleteModal(calling);
                      }}
                    >
                      <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <ul className="list-disc ml-4 custom-bullet-color">
                  <li className="text-gray-500 text-sm">
                    Años de experiencia: De {calling.min_exp_work} a más
                  </li>
                  <li className="text-gray-500 text-sm">
                    Resultados:
                    {calling.resultAt.toLocaleDateString()}
                  </li>
                  <li className="text-gray-500 text-sm">
                    <div className="flex flex-row justify-between">
                      <p>
                        Expiración: {calling.expiresAt.toLocaleDateString()}
                      </p>
                      <div className="flex flex-row gap-2">
                        <p className="text-black text-sm font-medium">
                          Requisitos
                        </p>
                        <svg
                          viewBox="0 0 512 512"
                          className={`h-5 w-5 cursor-pointer focus:outline-none ${
                            expandedStates[index]
                              ? 'fill-blue-600'
                              : 'fill-gray-500'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggle(index);
                          }}
                          aria-label={
                            expandedStates[index] ? 'Collapse' : 'Expand'
                          }
                        >
                          {expandedStates[index] ? (
                            <path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM135 241c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l87 87 87-87c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L273 345c-9.4 9.4-24.6 9.4-33.9 0L135 241z" />
                          ) : (
                            <path d="M0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM241 377c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l87-87-87-87c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L345 239c9.4 9.4 9.4 24.6 0 33.9L241 377z" />
                          )}
                        </svg>
                      </div>
                    </div>
                  </li>
                </ul>
                {/**Descripción de card */}
                {expandedStates[index] && (
                  <div className="border-t border-gray-300 mt-4 pt-2 flex flex-col gap-2">
                    <p className="text-black text-sm font-medium ">
                      Documentos por presentar
                    </p>
                    <ul className="list-disc ml-4 custom-bullet-color">
                      <li className="text-gray-500 text-sm">
                        DNI escaneado en formato .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Carné SUCAMEC escaneado en formato .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Licencia para portar armas escaneado en formato .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Antecedentes (penales, policiales o judiciales) o
                        Certificado único laboral escaneado en formato .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Certificado físico y psicológico escaneado en formato
                        .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Certificado de estudios escaneado en formato .pdf
                      </li>
                      <li className="text-gray-500 text-sm">
                        Certificado laboral escaneado en formato .pdf
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>

        {adviceIsOpen && (
          <UpdateDocumentModal
            isOpen={adviceIsOpen}
            onClose={closeAdviceModal}
          />
        )}
        {editIsOpen && (
          <CreateCallingModal
            isOpen={editIsOpen}
            onClose={closeEditModal}
            selectedCalling={selectedCalling}
          />
        )}
        {deleteIsOpen && (
          <DeleteCallingModal
            isOpen={deleteIsOpen}
            onClose={closeDeleteModal}
            selectedCalling={selectedCalling}
          />
        )}
        {isSuccess && (
          <SuccessfulApply isOpen={isSuccess} onClose={closeIsSuccessModal} />
        )}
      </Layout>
    </>
  );
}
