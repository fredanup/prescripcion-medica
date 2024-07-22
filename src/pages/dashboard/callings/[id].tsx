import { useSession } from 'next-auth/react';
import Image from 'next/image';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';

export default function Calling() {
  const { data: session } = useSession();
  return (
    <>
      <Layout>
        <FormTitle text="Postulantes" />
        <div className="flex flex-col p-6 rounded-lg drop-shadow-md bg-white mb-4">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-2 items-center">
              <Image
                className="rounded-full"
                width={60}
                height={60}
                src={session?.user?.image ?? ''}
                alt="User Avatar"
              />
              <div className="flex flex-col">
                <p className="text-black text-base font-medium">
                  Fredy Ángel Ugarte Portilla
                </p>
                <p className="text-gray-500 text-sm">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <svg
                viewBox="0 0 448 512"
                className={`h-4 w-4 cursor-pointer fill-gray-500`}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <path d="M364.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-row gap-6 ml-auto">
            <svg
              viewBox="0 0 640 512"
              className={`h-6 w-6 cursor-pointer fill-cyan-500`}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM625 177L497 305c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L591 143c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
            </svg>

            <svg
              viewBox="0 0 640 512"
              className={`h-6 w-6 cursor-pointer fill-pink-500`}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM471 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
            </svg>
          </div>
        </div>
      </Layout>
    </>
  );
}
