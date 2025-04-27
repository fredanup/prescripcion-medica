import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Spinner from '../utilities/spinner';

export default function Home() {
  //Obtenemos la sesión de la bd
  const { data: session, status } = useSession();

  //Inicialización de ruta
  const router = useRouter();

  //Redireccion al usuario a Main
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Aquí puedes mostrar un spinner o cualquier indicador de carga mientras se verifica el estado de autenticación
      return;
    }
    if (session) {
      // Si el usuario está autenticado, redirigir a la página protegida
      router.replace('/dashboard/callings').catch((error) => {
        // Manejar cualquier error que pueda ocurrir al redirigir
        console.error('Error al redirigir a la página principal:', error);
      });
    }
  }, [status, session, router]);

  // Renderizado durante la carga de sesión
  if (status === 'loading') {
    return <Spinner text={status} />;
  }

  // Pantalla de inicio de sesión si el usuario no está autenticado
  return (
    <>
      {status === 'unauthenticated' && (
        <>
          <Image
            src={'/wallpaper.jpg'}
            layout="fill"
            objectFit="cover"
            alt="Wallpaper"
          />
          <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
          <div className="fixed inset-0 flex items-center justify-center z-30 flex-col">
            <div className="bg-white rounded-lg shadow-lg p-9 flex flex-col m-9">
              <div className="flex flex-row justify-center items-center mt-4">
                <Image src={'/logo.png'} width={100} height={100} alt="Logo" />
              </div>

              <div className="flex flex-col gap-6 mt-4 p-2">
                <h1 className="font-bold text-3xl text-black text-outline-white text-center">
                  BIENVENIDO
                </h1>
                <p className="text-black text-sm font-light text-justify">
                  Seleccione su forma de inicio de sesión preferido. Puede ser
                  con su cuenta de Google o Facebook.
                </p>
              </div>
              <div className="flex flex-col justify-center items-center mt-9">
                <div
                  onClick={() => {
                    signIn('google').catch(console.log);
                  }}
                  className="cursor-pointer w-64 rounded-full border bg-orange-500 px-4 py-2 text-base font-normal text-white hover:bg-black hover:border-transparent flex flex-row gap-2 items-center justify-center"
                >
                  <Image
                    src={'/icons/google.png'}
                    width={30}
                    height={30}
                    alt="Logo"
                  />
                  <label className="cursor-pointer">Continuar con Google</label>
                </div>
                <div className="flex items-center w-64 my-3">
                  <div className="flex-grow h-px bg-gray-300"></div>
                  <span className="mx-4 text-gray-400 text-sm font-light">
                    o
                  </span>
                  <div className="flex-grow h-px bg-gray-300"></div>
                </div>

                <div
                  onClick={() => {
                    signIn('google').catch(console.log);
                  }}
                  className="cursor-pointer w-64 rounded-full border bg-[#145089] px-4 py-2 text-base font-normal text-white hover:bg-black hover:border-transparent flex flex-row gap-2 items-center justify-center"
                >
                  <Image
                    src={'/icons/facebook.png'}
                    className="fill-white"
                    width={30}
                    height={30}
                    alt="Logo"
                  />
                  <label className="cursor-pointer">
                    Continuar con Facebook
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Mostrar Spinner si el estado no es autenticado */}
      {status !== 'unauthenticated' && <Spinner text={status} />}
    </>
  );
}
