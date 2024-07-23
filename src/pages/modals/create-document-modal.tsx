import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpc } from 'utils/trpc';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const CreateDocumentModal = ({
  isOpen,
  onClose,
  opt,
}: {
  isOpen: boolean;
  onClose: () => void;
  opt: string;
}) => {
  //1. y 2. van de la mano
  //1. Hook que maneja estados de la prefirma con url, presignedUrl está vinculado a s3Url
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  //2. Limpiar campos
  const [academicDocument, setDocument] = useState('');

  //Hook de estado para cancelar o permitir la subida de archivos
  const [submitDisabled, setSubmitDisabled] = useState(true);

  //Hook que permite usar queries
  const apiUtils = trpc.useContext();

  //Mutación para subir archivos
  const { mutateAsync: fetchPresignedUrls } =
    trpc.document.createS3UserDocument.useMutation(); //Obtengo la ruta donde voy a almacenar, es una promesa

  //Mutación para la base de datos
  const createUserDocument =
    trpc.document.createOrUpdateDbUserDocument.useMutation();

  //Estilizado del fondo detrás del modal. Evita al usuario salirse del modal antes de elegir alguna opción
  const overlayClassName = isOpen
    ? 'fixed top-0 left-0 w-full h-full rounded-lg bg-gray-800 opacity-60 z-20'
    : 'hidden';

  useEffect(() => {
    // Bloquear el cuerpo de la página cuando se abre el modal
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    setDocument(opt);
    // Limpiar la clase y remover el bloqueo al desmontar el modal
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, opt]);

  //Hook de dropzone que permite almacenar los objetos a subir
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      maxFiles: 1,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      multiple: false,
      onDropAccepted: () => {
        fetchPresignedUrls({
          key: academicDocument, //A la ruta que obtuve le doy su clave
        })
          .then((url) => {
            setPresignedUrl(url); //Guardo la ruta completa
            setSubmitDisabled(false);
          })
          .catch((err) => console.error(err));
      },
    });

  //Esta función retorna un componente con el nombre del archivo y su tamaño
  const files = useMemo(() => {
    if (!submitDisabled)
      return acceptedFiles.map((file) => (
        <li key={file.name}>
          {file.name} - {file.size} bytes
        </li>
      ));
    return null;
  }, [acceptedFiles, submitDisabled]);

  //Función que controla el envío de datos de un formulario
  const handleSubmit = useCallback(async () => {
    if (acceptedFiles.length > 0 && presignedUrl !== null) {
      const file = acceptedFiles[0];

      await axios
        .put(presignedUrl, file.slice(), {
          headers: { 'Content-Type': file.type },
        })
        .then((response) => {
          console.log(response);
          console.log('Successfully uploaded ', file.name);
        })
        .catch((err) => console.error(err));

      // Update the document info in the database and invalidate the cache
      await createUserDocument.mutateAsync({
        document: academicDocument,
        key: academicDocument,
      });

      await apiUtils.document.getUserDocuments.invalidate();

      setSubmitDisabled(true);
    }
  }, [
    academicDocument,
    acceptedFiles,
    apiUtils.document.getUserDocuments,
    createUserDocument,
    presignedUrl,
  ]);

  return (
    <>
      {isOpen && (
        <div>
          {/* Fondo borroso y no interactivo */}
          <div className={overlayClassName}></div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              presignedUrl !== null && acceptedFiles[0]?.name !== undefined
                ? createUserDocument.mutate({
                    document: academicDocument,
                    key: academicDocument,
                  })
                : null;
              void handleSubmit();
              onClose();
              setDocument('');
            }}
            className="absolute left-1/2 top-1/2 z-20 w-11/12 -translate-x-1/2 -translate-y-1/2 transform flex flex-col gap-4 rounded-lg bg-white p-6 drop-shadow-lg"
          >
            <h1 className="text-xl font-medium text-black">Subir documento</h1>
            <p className="text-justify text-base font-light text-gray-500">
              Seleccione el documento a subir y complete los datos del
              formulario
            </p>

            <div
              {...getRootProps()}
              className="dropzone-container flex flex-col gap-2 h-40 w-full items-center justify-center cursor-pointer rounded-lg border-dashed border-2 border-gray-400"
            >
              <svg viewBox="0 0 384 512" className="w-10 h-10 fill-gray-500">
                <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM216 408c0 13.3-10.7 24-24 24s-24-10.7-24-24V305.9l-31 31c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l72-72c9.4-9.4 24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-31-31V408z" />
              </svg>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-base font-medium text-slate-900">
                  Arrastre su documento aquí
                </p>
              ) : (
                <p className="text-base font-medium text-slate-900">
                  Haga clic o arrastre su documento aquí
                </p>
              )}
            </div>
            <aside>
              <p className="text-sm font-medium text-slate-900">
                Archivo cargado:
              </p>
              <ul className="text-sm font-light text-gray-500">{files}</ul>
            </aside>

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
                className="rounded-lg border bg-amber-600 px-4 py-1 text-base font-medium text-white"
                disabled={
                  presignedUrl === null ||
                  acceptedFiles.length === 0 ||
                  submitDisabled
                }
              >
                Continuar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default CreateDocumentModal;
