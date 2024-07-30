import Link from 'next/link';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { trpc } from 'utils/trpc';

export default function Results() {
  const { data: applicationResults } =
    trpc.application.getApplicationResults.useQuery();

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
                <h3 className="text-black text-base font-medium">
                  {result.Calling.requirement}
                </h3>
                <h4
                  className={`${
                    result.status === 'approved'
                      ? ' text-sky-500 text-base'
                      : 'text-pink-500 text-base'
                  }`}
                >
                  Resultado:
                  {result.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </h4>
                <div className="w-full">
                  <ul className="list-disc ml-4 custom-bullet-color">
                    <Link
                      className="text-gray-500 text-sm"
                      href={`https://pacificsecurity.s3.amazonaws.com/${result.resumeKey}`}
                    >
                      Currículum presentado
                    </Link>
                    <li className="text-gray-500 text-sm">
                      Observaciones: {result.review}
                    </li>
                    <li className="text-gray-500 text-sm">
                      Evaluador: {result.Calling.User?.name}{' '}
                      {result.Calling.User?.lastName}
                    </li>
                    <li className="text-gray-500 text-sm">
                      Contacto: {result.Calling.User?.email}
                    </li>
                    <li className="text-gray-500 text-sm">
                      Fecha de entrevista :
                      {result.interviewAt?.toLocaleDateString()}
                    </li>
                    <Link
                      className="text-gray-500 text-sm"
                      href={result.interviewLink ?? ''}
                    >
                      Enlace para la entrevista :{result.interviewLink}
                    </Link>
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
