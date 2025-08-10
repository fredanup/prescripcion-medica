import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SignOut from './signout-button';
import { menuByRole } from 'utils/menuByRole';
import { useRouter } from 'next/router';

export default function NavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  const activeRole = session?.user?.activeRole;
  const menu =
    activeRole && activeRole in menuByRole
      ? menuByRole[activeRole as keyof typeof menuByRole]
      : [];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 p-2 border-t border-[#E4E8EB] flex flex-row bg-[#F7F7F8] justify-evenly items-center 
                 md:justify-normal md:items-stretch md:static md:flex md:flex-col md:h-full md:gap-8 md:pt-8 md:px-4 
                 md:rounded-tl-xl md:rounded-bl-xl md:border-r md:border-r-[#E4E8EB]"
    >
      {/* Logo en desktop */}
      <div className="hidden md:w-full md:flex md:justify-center">
        <Image src="/logo.png" width={75} height={75} alt="Logo" />
      </div>

      {menu.map((item) => {
        const isActive = router.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center gap-0.5 md:flex-row md:gap-2 group"
          >
            <item.icon
              className={`h-8 w-8 p-1.5 rounded-lg transition-colors duration-200 
                ${
                  isActive
                    ? 'text-[#2563EB] bg-white shadow-sm'
                    : 'text-gray-500 group-hover:text-[#1D4ED8]'
                }`}
            />
            <p
              className={`text-sm font-medium transition-colors duration-200
                ${
                  isActive
                    ? 'text-[#2563EB]'
                    : 'text-gray-500 group-hover:text-[#1D4ED8]'
                }`}
            >
              {item.label}
            </p>
          </Link>
        );
      })}

      {/* Botón de cerrar sesión */}
      <SignOut />
    </nav>
  );
}
