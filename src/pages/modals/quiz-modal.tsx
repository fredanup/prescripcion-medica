import { FormEvent, useState } from 'react';
import FormTitle from 'utilities/form-title';
import ConfirmationModal from './confirmation-modal';
import RejectModal from './reject-modal';

export default function QuizModal({
  isOpen,
  onClose,
  applicationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}) {
  const [laboralExp, setLaboralExp] = useState<number>(-1);
  const [certEstudio, setCertEstudio] = useState<number>(-1);
  const [sucamec, setSucamec] = useState<number>(-1);

  const [licArmas, setLicArmas] = useState<number>(-1);

  const [dni, setDni] = useState<number>(-1);

  const [cul, setCUL] = useState<number>(-1);

  const [certFisPsi, setCertFisPsi] = useState<number>(-1);

  const [isConfirmed, setIsConfirmed] = useState(false);

  const [isReject, setIsReject] = useState(false);

  const [testResult, setTestResult] = useState<Record<string, number>>({});

  //Estilizado del fondo detrás del modal. Evita al usuario salirse del modal antes de elegir alguna opción
  const overlayClassName = isOpen
    ? 'fixed top-0 left-0 w-full h-full rounded-lg bg-gray-800 opacity-60 z-20'
    : 'hidden';

  if (!isOpen) {
    return null; // No renderizar el modal si no está abierto
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const quizData: Record<string, number> = {};

    quizData.laboralExp = laboralExp;
    quizData.certEstudio = certEstudio;
    quizData.sucamec = sucamec;
    quizData.licArmas = licArmas;
    quizData.dni = dni;
    quizData.cul = cul;
    quizData.certFisPsi = certFisPsi;
    const result =
      laboralExp * certEstudio * sucamec * licArmas * dni * cul * certFisPsi;

    if (result > 0) {
      openConfirmationModal();
    } else {
      openRejectModal(quizData);
    }
  };

  const openConfirmationModal = () => {
    setIsConfirmed(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmed(false);
  };

  const openRejectModal = (testResult: Record<string, number>) => {
    setIsReject(true);
    setTestResult(testResult);
  };

  const closeRejectModal = () => {
    setIsReject(false);
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Fondo borroso y no interactivo */}
          <div className={overlayClassName}></div>
          <form
            className="fixed inset-0 z-30 flex items-center justify-center p-4 mb-4"
            onSubmit={handleSubmit}
          >
            <div className="max-h-[calc(100%-5rem)] overflow-y-auto flex flex-col gap-2 rounded-lg bg-white p-6 drop-shadow-lg">
              <FormTitle text="Cuestionario" />
              <p className="text-sm font-light text-gray-500 text-justify">
                Complete el formulario de acuerdo al expediente del postulante
              </p>

              {/**Radio button */}

              <div>
                <label className="text-black text-sm font-bold">
                  Experiencia laboral:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="laboralExp2"
                      value={2}
                      checked={laboralExp === 2}
                      onChange={(event) =>
                        setLaboralExp(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="laboralExp2" className="mr-4">
                      Cumple (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="laboralExp1"
                      value={0}
                      checked={laboralExp === 0}
                      onChange={(event) =>
                        setLaboralExp(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="laboralExp1" className="mr-4">
                      No cumple (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  Certificado de estudios:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="certEstudio2"
                      value={2}
                      checked={certEstudio === 2}
                      onChange={(event) =>
                        setCertEstudio(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="certEstudio2" className="mr-4">
                      Válido (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="certEstudio1"
                      value={0}
                      checked={certEstudio === 0}
                      onChange={(event) =>
                        setCertEstudio(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="certEstudio1" className="mr-4">
                      Inválido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  Carné SUCAMEC:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="sucamec2"
                      value={2}
                      checked={sucamec === 2}
                      onChange={(event) =>
                        setSucamec(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="sucamec2" className="mr-4">
                      Vigente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="sucamec1"
                      value={0}
                      checked={sucamec === 0}
                      onChange={(event) =>
                        setSucamec(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="sucamec1" className="mr-4">
                      Vencido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  Licencias de portar armas:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="licArmas2"
                      value={2}
                      checked={licArmas === 2}
                      onChange={(event) =>
                        setLicArmas(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="licArmas2" className="mr-4">
                      Vigente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="licArmas1"
                      value={0}
                      checked={licArmas === 0}
                      onChange={(event) =>
                        setLicArmas(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="licArmas1" className="mr-4">
                      Vencido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">DNI:</label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="dni2"
                      value={2}
                      checked={dni === 2}
                      onChange={(event) => setDni(Number(event.target.value))}
                      className="mr-2"
                    />
                    <label htmlFor="dni2" className="mr-4">
                      Vigente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="dni1"
                      value={0}
                      checked={dni === 0}
                      onChange={(event) => setDni(Number(event.target.value))}
                      className="mr-2"
                    />
                    <label htmlFor="dni1" className="mr-4">
                      Vencido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  Certificado Único Laboral:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="cul2"
                      value={2}
                      checked={cul === 2}
                      onChange={(event) => setCUL(Number(event.target.value))}
                      className="mr-2"
                    />
                    <label htmlFor="cul2" className="mr-4">
                      Vigente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="cul1"
                      value={0}
                      checked={cul === 0}
                      onChange={(event) => setCUL(Number(event.target.value))}
                      className="mr-2"
                    />
                    <label htmlFor="cul1" className="mr-4">
                      Vencido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  Certificado Fisico-Psicologico:
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="certFisPsi2"
                      value={2}
                      checked={certFisPsi === 2}
                      onChange={(event) =>
                        setCertFisPsi(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="certFisPsi2" className="mr-4">
                      Vigente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="certFisPsi1"
                      value={0}
                      checked={certFisPsi === 0}
                      onChange={(event) =>
                        setCertFisPsi(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="certFisPsi1" className="mr-4">
                      Vencido (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 flex flex-row justify-end gap-2 border-t border-gray-200">
                <button
                  className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg border bg-sky-500 px-4 py-1 text-base font-medium text-white"
                >
                  Calificar
                </button>
              </div>
            </div>
          </form>
        </>
      )}
      {isConfirmed && (
        <ConfirmationModal
          isOpen={isConfirmed}
          applicationId={applicationId}
          onClose={closeConfirmationModal}
          onClose2={onClose}
        />
      )}
      {isReject && (
        <RejectModal
          testResult={testResult}
          isOpen={isReject}
          applicationId={applicationId}
          onClose={closeRejectModal}
          onClose2={onClose}
        />
      )}
    </>
  );
}
