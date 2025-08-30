import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Spinner from '../utilities/spinner';
import { trpc } from 'utils/trpc';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: dashboardRoute, isLoading: isLoadingRoute } =
    trpc.auth.getDashboardRoute.useQuery(undefined, {
      enabled: status === 'authenticated' && !isRedirecting,
      refetchOnWindowFocus: false, // Evitar refetch innecesarios
    });

  // Manejar redirección
  useEffect(() => {
    if (dashboardRoute && !isRedirecting) {
      setIsRedirecting(true);
      router.replace(dashboardRoute).catch(console.error);
    }
  }, [dashboardRoute, router, isRedirecting]);

  // Mientras está cargando la sesión inicial
  if (status === 'loading') {
    return <Spinner text="Cargando sesión..." />;
  }

  // Mientras está autenticado pero cargando la ruta
  if (status === 'authenticated' && (isLoadingRoute || isRedirecting)) {
    return <Spinner text="Redirigiendo..." />;
  }

  // Si está autenticado pero no hay dashboardRoute, mostrar error
  if (
    status === 'authenticated' &&
    !isLoadingRoute &&
    !dashboardRoute &&
    !isRedirecting
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Error: No se pudo determinar la ruta del dashboard</p>
      </div>
    );
  }

  // Pantalla de login para usuarios no autenticados
  return (
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
              Seleccione su forma de inicio de sesión preferido. Puede ser con
              su cuenta de Google o Facebook.
            </p>
          </div>
          <div className="flex flex-col justify-center items-center mt-9">
            <div
              onClick={() => {
                signIn('google', { callbackUrl: '/' }).catch(console.log);
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
              <span className="mx-4 text-gray-400 text-sm font-light">o</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            <div
              onClick={() => {
                // ¡Cambiar a Facebook provider!
                signIn('facebook', { callbackUrl: '/' }).catch(console.log);
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
              <label className="cursor-pointer">Continuar con Facebook</label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
