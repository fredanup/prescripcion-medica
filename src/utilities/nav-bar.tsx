import Image from 'next/image';

import { useSession } from 'next-auth/react';
import { trpc } from 'utils/trpc';
import Link from 'next/link';
import SignOut from './signout-button';

export default function NavBar() {
  //Obtenemos la sesión de la bd
  const { data: session } = useSession();

  /**
   * Consultas a base de datos
   */

  //Obtener el usuario actual
  const { data: currentUser } = trpc.user.findOne.useQuery(
    session?.user?.id ?? '',
  );
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-10 p-1 border-t border-gray-200 flex flex-row bg-white justify-evenly items-center md:rounded-lg md:drop-shadow-lg md:justify-normal md:items-stretch md:static md:flex md:flex-col md:h-full md:border-0 md:gap-8 md:pt-8 md:px-4`}
    >
      <div className="hidden md:w-full md:flex md:flex-row md:justify-center">
        <Image src="/logo.png" width={75} height={75} alt="Logo" />
      </div>

      <Link
        href={'/dashboard/callings'}
        className="flex flex-col items-center md:flex md:flex-row md:gap-1"
      >
        <svg
          viewBox="0 0 512 512"
          className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
        >
          <path d="M256 0c17.7 0 32 14.3 32 32V66.7C368.4 80.1 431.9 143.6 445.3 224H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H445.3C431.9 368.4 368.4 431.9 288 445.3V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V445.3C143.6 431.9 80.1 368.4 66.7 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H66.7C80.1 143.6 143.6 80.1 224 66.7V32c0-17.7 14.3-32 32-32zM128 256a128 128 0 1 0 256 0 128 128 0 1 0 -256 0zm128-80a80 80 0 1 1 0 160 80 80 0 1 1 0-160z" />
        </svg>
        <p className="text-gray-500 text-sm cursor-pointer">Convocatorias</p>
      </Link>
      {currentUser?.role?.match('applicant') && (
        <Link
          href={'/dashboard/results'}
          className="flex flex-col items-center md:flex md:flex-row md:gap-1"
        >
          <svg
            viewBox="0 0 576 512"
            className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
          >
            <path d="M112 0C99.1 0 87.4 7.8 82.5 19.7l-66.7 160-13.3 32c-6.8 16.3 .9 35 17.2 41.8s35-.9 41.8-17.2L66.7 224l90.7 0 5.1 12.3c6.8 16.3 25.5 24 41.8 17.2s24-25.5 17.2-41.8l-13.3-32-66.7-160C136.6 7.8 124.9 0 112 0zm18.7 160l-37.3 0L112 115.2 130.7 160zM256 32l0 96 0 96c0 17.7 14.3 32 32 32l80 0c44.2 0 80-35.8 80-80c0-23.1-9.8-43.8-25.4-58.4c6-11.2 9.4-24 9.4-37.6c0-44.2-35.8-80-80-80L288 0c-17.7 0-32 14.3-32 32zm96 64l-32 0 0-32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16zm-32 64l32 0 16 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-48 0 0-32zM566.6 310.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L352 434.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l192-192z" />
          </svg>

          <p className="text-gray-500 text-sm cursor-pointer">Resultados</p>
        </Link>
      )}

      {!currentUser?.role?.match('applicant') && (
        <Link
          href={'/dashboard/users'}
          className="flex flex-col items-center md:flex md:flex-row md:gap-1"
        >
          <svg
            viewBox="0 0 640 512"
            className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
          >
            <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" />
          </svg>
          <p className="text-gray-500 text-sm cursor-pointer">Usuarios</p>
        </Link>
      )}

      <Link
        href={'/dashboard/profile'}
        className="flex flex-col items-center md:flex md:flex-row md:gap-1"
      >
        <svg
          viewBox="0 0 512 512"
          className={`h-8 w-8 cursor-pointer fill-gray-500 p-1.5  `}
        >
          <path d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z" />
        </svg>
        <p className="text-gray-500 text-sm cursor-pointer">Perfil</p>
      </Link>
      <SignOut />
    </nav>
  );
}
