import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuizModal from 'pages/modals/quiz-modal';
import QuizModal2 from 'pages/modals/quiz-modal2';
import { useEffect, useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import { IJobApplication } from 'utils/auth';
import { trpc } from 'utils/trpc';

export default function Calling() {
  const router = useRouter();
  const { id } = router.query; // Obtener el parámetro `id` de la ruta
  const [isTest, setIsTest] = useState(false);
  const [isTest2, setIsTest2] = useState(false);
  const [applicationId, setApplicationId] = useState<string>('');
  // Asegúrate de que callingId esté definido antes de usarlo en la consulta
  const { data: callingApplicants } =
    trpc.application.getApplicantsByCalling.useQuery(
      { callingId: id as string }, // Asegúrate de que el tipo sea string
      {
        enabled: !!id, // La consulta solo se ejecutará si `id` está definido
      },
    );

  // Estado para almacenar los aplicantes
  const [applicants, setApplicants] = useState<IJobApplication[] | undefined>(
    undefined,
  );

  // Actualizar el estado cuando se obtengan los datos de los aplicantes
  useEffect(() => {
    if (callingApplicants) {
      setApplicants(callingApplicants);
    }
  }, [callingApplicants]); // Agregar `callingApplicants.data` como dependencia

  const openQuizModal = (applicationId: string) => {
    setIsTest(true);
    setApplicationId(applicationId);
  };

  const closeQuizModal = () => {
    setIsTest(false);
  };

  const openQuiz2Modal = (applicationId: string) => {
    setIsTest2(true);
    setApplicationId(applicationId);
  };

  const closeQuiz2Modal = () => {
    setIsTest2(false);
  };
  return (
    <>
      <Layout>
        <FormTitle text="Postulantes" />
        {applicants?.map((applicant, index) => (
          <div
            className="flex flex-col p-6 rounded-lg drop-shadow-md bg-white mb-4"
            key={index}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  className="rounded-full"
                  width={60}
                  height={60}
                  src={applicant.Postulant.image ?? '/avatar'}
                  alt="User Avatar"
                />
                <div className="flex flex-col">
                  <p className="text-black text-base font-medium">
                    {applicant.Postulant.name} {applicant.Postulant.lastName}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {applicant.Postulant.email}
                  </p>

                  <p className="text-gray-500 text-sm">
                    {applicant.interviewAt?.toLocaleDateString() ?? ''}
                  </p>
                  <Link
                    className="text-gray-500 text-sm"
                    href={applicant.interviewLink ?? ''}
                  >
                    {applicant.interviewLink ?? ''}
                  </Link>
                </div>
              </div>
              <Link
                className="flex flex-row gap-2 items-center"
                href={`https://pacificsecurity.s3.amazonaws.com/${applicant.resumeKey}`}
              >
                <svg
                  viewBox="0 0 448 512"
                  className={`h-4 w-4 cursor-pointer fill-gray-500`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <path d="M364.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z" />
                </svg>
                <p className="text-gray-500 text-sm">Expediente</p>
              </Link>
            </div>
            <div className="flex flex-row gap-6 ml-auto">
              <div
                className={`flex flex-row gap-2 items-center ${
                  applicant.status === 'pending' ? 'block' : 'hidden'
                }`}
              >
                <p className="text-gray-500 text-sm">Evaluación I</p>
                <svg
                  viewBox="0 0 384 512"
                  className="h-6 w-6 cursor-pointer fill-cyan-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    openQuizModal(applicant.id);
                  }}
                >
                  <path d="M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16z" />
                </svg>
              </div>

              <div
                className={`flex flex-row gap-2 items-center ${
                  applicant.status === 'approved' ? 'block' : 'hidden'
                }`}
              >
                <p className="text-gray-500 text-sm">Evaluación II</p>
                <svg
                  viewBox="0 0 384 512"
                  className="h-6 w-6 cursor-pointer fill-pink-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    openQuiz2Modal(applicant.id);
                  }}
                >
                  <path d="M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16z" />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {isTest && (
          <QuizModal
            isOpen={isTest}
            onClose={closeQuizModal}
            applicationId={applicationId}
          />
        )}
        {isTest2 && (
          <QuizModal2
            isOpen={isTest2}
            onClose={closeQuiz2Modal}
            applicationId={applicationId}
          />
        )}
      </Layout>
    </>
  );
}
