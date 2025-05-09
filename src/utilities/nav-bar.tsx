import Image from 'next/image';

import { useSession } from 'next-auth/react';
import { trpc } from 'utils/trpc';
import Link from 'next/link';
import SignOut from './signout-button';
import { menuByRole } from 'utils/menuByRole';
import { useRouter } from 'next/router';

export default function NavBar() {
  //Obtenemos la sesión de la bd
  const { data: session } = useSession();
  const router = useRouter();
  /**
   * Consultas a base de datos
   */

  //Obtener el usuario actual
  const { data: currentUser } = trpc.user.findOne.useQuery(
    session?.user?.id ?? '',
  );

  //Definición de los menús por rol
  const menu =
    currentUser?.role && currentUser.role in menuByRole
      ? menuByRole[currentUser.role as keyof typeof menuByRole] || []
      : [];

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-10 p-1 border-t border-gray-200 flex flex-row bg-[#F7F7F8] justify-evenly items-center md:justify-normal md:items-stretch md:static md:flex md:flex-col md:h-full md:gap-8 md:pt-8 md:px-4 md:rounded-tl-md md:rounded-bl-md md:border-r md:border-r-[#E4E8EB]`}
    >
      <div className="hidden md:w-full md:flex md:flex-row md:justify-center">
        <Image src="/logo.png" width={75} height={75} alt="Logo" />
      </div>

      {menu.map((item) => {
        const isActive = router.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center md:flex md:flex-row md:gap-1"
          >
            <item.icon
              className={`h-8 w-8 cursor-pointer p-1.5 ${
                isActive ? 'text-pink-500' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm cursor-pointer ${
                isActive ? 'text-pink-500' : 'text-gray-500'
              } text-gray-500 text-sm cursor-pointer`}
            >
              {item.label}
            </p>
          </Link>
        );
      })}
      <SignOut />
    </nav>
  );
}
