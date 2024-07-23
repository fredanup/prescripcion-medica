import FormTitle from 'utilities/form-title';

export default function UnvalidDocument({
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
              <svg className="h-16 w-16 fill-yellow-500" viewBox="0 0 512 512">
                <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
              </svg>

              <div className="w-full flex flex-col gap-2">
                <FormTitle text="Aviso" />
                <p className="text-sm font-light text-gray-500 text-justify">
                  Usted no ha subido aún este documento
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
