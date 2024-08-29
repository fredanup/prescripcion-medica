import { FormEvent, useState } from 'react';
import FormTitle from 'utilities/form-title';
import ConfirmationModal2 from './confirmation-modal2';

export default function QuizModal2({
  isOpen,
  onClose,
  applicationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}) {
  const [quest1, setQuest1] = useState<number>(-1);
  const [quest2, setQuest2] = useState<number>(-1);
  const [quest3, setQuest3] = useState<number>(-1);
  const [quest4, setQuest4] = useState<number>(-1);
  const [quest5, setQuest5] = useState<number>(-1);
  const [quest6, setQuest6] = useState<number>(-1);
  const [quest7, setQuest7] = useState<number>(-1);
  const [quest8, setQuest8] = useState<number>(-1);

  const [isConfirmed, setIsConfirmed] = useState(false);

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

    quizData.quest1 = quest1;
    quizData.quest2 = quest2;
    quizData.quest3 = quest3;
    quizData.quest4 = quest4;
    quizData.quest5 = quest5;
    quizData.quest6 = quest6;
    quizData.quest7 = quest7;
    quizData.quest8 = quest8;

    openConfirmationModal(quizData);
  };

  const openConfirmationModal = (testResult: Record<string, number>) => {
    setIsConfirmed(true);
    setTestResult(testResult);
  };

  const closeConfirmationModal = () => {
    setIsConfirmed(false);
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
                  1. ¿Cuál es su experiencia como guardia de seguridad?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest1_2"
                      value={2}
                      checked={quest1 === 2}
                      onChange={(event) =>
                        setQuest1(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest1_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest1_1"
                      value={0}
                      checked={quest1 === 0}
                      onChange={(event) =>
                        setQuest1(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest1_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  2. ¿Cómo se mantiene alerta durante su turno?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest2_2"
                      value={2}
                      checked={quest2 === 2}
                      onChange={(event) =>
                        setQuest2(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest2_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest2_1"
                      value={0}
                      checked={quest2 === 0}
                      onChange={(event) =>
                        setQuest2(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest2_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  3. ¿Ha tenido que atender a una persona en peligro? ¿Cómo
                  actuó?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest3_2"
                      value={2}
                      checked={quest3 === 2}
                      onChange={(event) =>
                        setQuest3(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest3_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest3_1"
                      value={0}
                      checked={quest3 === 0}
                      onChange={(event) =>
                        setQuest3(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest3_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  4. ¿Se considera un buen trabajador en equipo?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest4_2"
                      value={2}
                      checked={quest4 === 2}
                      onChange={(event) =>
                        setQuest4(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest4_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest4_1"
                      value={0}
                      checked={quest4 === 0}
                      onChange={(event) =>
                        setQuest4(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest4_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  5. ¿Cómo actuaría en caso de robo o vandalismo?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest5_2"
                      value={2}
                      checked={quest5 === 2}
                      onChange={(event) =>
                        setQuest5(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest5_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest5_1"
                      value={0}
                      checked={quest5 === 0}
                      onChange={(event) =>
                        setQuest5(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest5_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  6. ¿Cuáles son sus expectativas salariales?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest6_2"
                      value={2}
                      checked={quest6 === 2}
                      onChange={(event) =>
                        setQuest6(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest6_2" className="mr-4">
                      Dentro de lo que podemos ofrecer (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest6_1"
                      value={0}
                      checked={quest6 === 0}
                      onChange={(event) =>
                        setQuest6(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest6_1" className="mr-4">
                      Fuera de lo que podemos ofrecer (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  7. ¿Cómo se mantiene al día de los últimos protocolos y
                  tecnologías de seguridad?
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest7_2"
                      value={2}
                      checked={quest7 === 2}
                      onChange={(event) =>
                        setQuest7(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest7_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest7_1"
                      value={0}
                      checked={quest7 === 0}
                      onChange={(event) =>
                        setQuest7(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest7_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-black text-sm font-bold">
                  8. Describa una situación en la que haya tenido que hacer
                  frente a una emergencia
                </label>
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest8_2"
                      value={2}
                      checked={quest8 === 2}
                      onChange={(event) =>
                        setQuest8(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest8_2" className="mr-4">
                      Descripción convincente (2 puntos)
                    </label>
                  </div>
                  <div className="flex flex-row items-center">
                    <input
                      type="radio"
                      id="quest8_1"
                      value={0}
                      checked={quest8 === 0}
                      onChange={(event) =>
                        setQuest8(Number(event.target.value))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="quest8_1" className="mr-4">
                      Descripción imprecisa (0 puntos)
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
        <ConfirmationModal2
          testResult={testResult}
          isOpen={isConfirmed}
          applicationId={applicationId}
          onClose={closeConfirmationModal}
          onClose2={onClose}
        />
      )}
    </>
  );
}
