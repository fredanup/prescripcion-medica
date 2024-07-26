import FormTitle from 'utilities/form-title';

export default function SuccessfulApply({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  //Estilizado del fondo detrás del modal. Evita al usuario salirse del modal antes de elegir alguna opción
  const overlayClassName = isOpen
    ? 'fixed top-0 left-0 w-full h-full rounded-lg bg-gray-800 opacity-60 z-20'
    : 'hidden';

  if (!isOpen) {
    return null; // No renderizar el modal si no está abierto
  }
  return (
    <>
      {isOpen && (
        <>
          {/* Fondo borroso y no interactivo */}
          <div className={overlayClassName}></div>
          <form className="absolute top-1/2 left-1/2 z-30 w-11/12 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 rounded-lg bg-white p-6 drop-shadow-lg">
            {/**Header y botón de cierre */}
            <div className="flex flex-row gap-4">
              <div className="w-full flex flex-col gap-2">
                <FormTitle text="Felicidades" />
                <p className="text-sm font-light text-gray-500 text-justify">
                  Usted acaba de presentar su postulación
                </p>

                <div className="mt-4 pt-4 flex flex-row justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
}
