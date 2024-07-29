import { FormEvent, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import FormTitle from 'utilities/form-title';
import { trpc } from 'utils/trpc';
import 'react-datepicker/dist/react-datepicker.css';
export default function ConfirmationModal({
  isOpen,
  onClose,
  applicationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}) {
  const acceptApplicant = trpc.application.acceptApplication.useMutation();
  const [interviewAt, setInterviewAt] = useState<Date | null>(null);
  const [interviewLink, setInterviewLink] = useState<string | null>('');
  //Estilizado del fondo detrás del modal. Evita al usuario salirse del modal antes de elegir alguna opción
  const overlayClassName = isOpen
    ? 'fixed top-0 left-0 w-full h-full rounded-lg bg-gray-800 opacity-60 z-20'
    : 'hidden';

  if (!isOpen) {
    return null; // No renderizar el modal si no está abierto
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const applicationData = {
      id: applicationId,
      interviewAt: interviewAt,
      interviewLink: interviewLink,
    };
    if (applicationId) {
      acceptApplicant.mutate(applicationData);
      onClose();
    }
  };
  return (
    <>
      {isOpen && (
        <>
          {/* Fondo borroso y no interactivo */}
          <div className={overlayClassName}></div>
          <form
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-40 w-11/12 md:w-auto overflow-auto rounded-lg bg-white p-9"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <FormTitle text="Confirmar elección" />
              <p className="text-justify text-base font-light text-gray-500">
                Complete los campos presentados a continuación:
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-black text-sm font-bold">
                  Link para la entrevista:
                </label>
                <input
                  type="text"
                  className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
                  value={interviewLink ?? ''}
                  onChange={(event) => setInterviewLink(event.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-black text-sm font-bold">
                  Fecha de la entrevista:
                </label>
                <ReactDatePicker
                  selected={interviewAt}
                  onChange={(date) => setInterviewAt(date)}
                  className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
                  dateFormat="dd/MM/yyyy"
                  required
                />
              </div>

              <div className="mt-4 pt-4 flex flex-row justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg border bg-sky-500 px-4 py-1 text-base font-medium text-white"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
}
