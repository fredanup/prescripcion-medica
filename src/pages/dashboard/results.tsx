import { useSession } from 'next-auth/react';
import Link from 'next/link';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { trpc } from 'utils/trpc';

export default function Results() {
  // Obtener la sesión de la BD
  const { status } = useSession();
  const { data: applicationResults } =
    trpc.application.getApplicationResults.useQuery(undefined, {
      enabled: status === 'authenticated',
    });

  return (
    <>
      <Layout>
        <FormTitle text="Resultados" />
        <>
          {applicationResults?.map((result, index) => (
            <div
              className="flex flex-col gap-2 p-6 rounded-lg drop-shadow-md bg-white mb-4"
              key={index}
            >
              <div className="flex flex-col">
                <div className="flex flex-row justify-between">
                  <h3 className="text-black text-base font-medium">
                    {result.Calling.requirement}
                  </h3>
                  <h3
                    className={`${
                      result.status === 'approved'
                        ? ' text-sky-500 text-base'
                        : 'text-pink-500 text-base'
                    }`}
                  >
                    {result.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </h3>
                </div>
                <div className="flex flex-row justify-between">
                  <div className=""></div>

                  <Link
                    className="text-gray-500 text-sm ml-auto"
                    href={`https://pacificsecurity.s3.amazonaws.com/${result.resumeKey}`}
                  >
                    Ver expediente
                  </Link>
                </div>

                <div className="w-full">
                  <ul className="list-disc ml-4 custom-bullet-color">
                    <li>
                      <Link
                        className="text-gray-500 text-sm flex flex-row gap-2 items-center"
                        href={result.interviewLink ?? ''}
                      >
                        Sala de entrevista
                        <svg
                          viewBox="0 0 512 512"
                          className="h-3 w-3 cursor-pointer fill-gray-500 "
                        >
                          <path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3l0 82.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 32C35.8 32 0 67.8 0 112L0 432c0 44.2 35.8 80 80 80l320 0c44.2 0 80-35.8 80-80l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-320c0-8.8 7.2-16 16-16l112 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 32z" />
                        </svg>
                      </Link>
                    </li>
                    <li className="text-gray-500 text-sm">
                      Observaciones: {result.review ? result.review : 'Ninguna'}
                    </li>

                    <li className="text-gray-500 text-sm">
                      Fecha de entrevista :
                      {result.interviewAt?.toLocaleDateString()}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </>
      </Layout>
    </>
  );
}
