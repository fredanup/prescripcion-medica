import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import Spinner from 'utilities/spinner';
import { trpc } from 'utils/trpc';

export default function Profile() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session || status !== 'authenticated') {
      <Spinner text={status} />;
    }
  }, [status, session]);

  const { data: currentUser } = trpc.user.findCurrentOne.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  return (
    <Layout>
      <FormTitle text="Perfil" />

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center gap-6 mb-6">
        <Image
          className="rounded-full border-4 border-blue-100 shadow-sm"
          src={currentUser?.image || '/avatar.png'}
          width={100}
          height={100}
          alt="Foto de perfil"
        />
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentUser?.name} {currentUser?.lastName}
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">
            Usuario activo
          </p>
          <p className="text-sm text-gray-500 mt-1">{currentUser?.email}</p>
          <p className="text-sm text-gray-500">{currentUser?.phone}</p>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 border-b pb-2">
          Información personal
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Nombres', value: currentUser?.name },
            { label: 'Apellidos', value: currentUser?.lastName },
            {
              label: 'Fecha de nacimiento',
              value: currentUser?.birthDate?.toLocaleDateString(),
            },
            { label: 'Teléfono', value: currentUser?.phone },
            { label: 'Correo', value: currentUser?.email },
            { label: 'Dirección', value: currentUser?.address },
            { label: 'Estatus marital', value: currentUser?.maritalStatus },
            { label: 'DNI', value: currentUser?.documentNumber },
          ].map((item, idx) => (
            <div key={idx}>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-800">
                {item.value || '-'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
