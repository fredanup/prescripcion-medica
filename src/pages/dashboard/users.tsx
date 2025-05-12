import { useSession } from 'next-auth/react';
import Image from 'next/image';
import DeleteUserModal from 'pages/modals/delete-user-modal';
import ErrorDeletingUser from 'pages/modals/error-deleting-user';
import UpdateUserModal from 'pages/modals/update-user-modal';

import { useState } from 'react';
import FormTitle from 'utilities/form-title';
import Layout from 'utilities/layout';
import type { IUserBranch } from 'utils/auth';
import { getRoleLabel } from 'utils/roleLabel';

import { trpc } from 'utils/trpc';

export default function Users() {
  //Obtenemos la sesión de la bd
  const { data: session, status } = useSession();
  //Hook de estado que controla la apertura del modal de edición
  const [editIsOpen, setEditIsOpen] = useState(false);
  //Hook de estado que controla la apertura del modal de eliminación
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  //Hook de estado que almacena el registro seleccionado
  const [selectedUser, setSelectedUser] = useState<IUserBranch | null>(null);
  /**
   * Consultas a base de datos
   */
  //Obtener todos los usuarios creados con su sucursal
  const { data: users } = trpc.user.findManyUserBranch.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  //Obtener el usuario actual
  const { data: currentUser } = trpc.user.findCurrentOne.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  //Función de selección de registro y apertura de modal de edición
  const openEditModal = (user: IUserBranch) => {
    setSelectedUser(user);
    setEditIsOpen(true);
  };
  //Función de cierre de modal de edición
  const closeEditModal = () => {
    setEditIsOpen(false);
  };
  //Función de selección de registro y apertura de modal de eliminación
  const openDeleteModal = (user: IUserBranch) => {
    setSelectedUser(user);
    setDeleteIsOpen(true);
  };
  //Función de cierre de modal de eliminación
  const closeDeleteModal = () => {
    setDeleteIsOpen(false);
  };

  if (!session?.user) return null;

  return (
    <>
      <Layout>
        <FormTitle text={'Gestión de usuarios '} />
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-200 text-left text-black text-sm font-light">
              <tr>
                <th className="py-4 pr-2">Usuarios</th>
                <th className="py-4 pr-2">Rol</th>
                <th className="py-4 pr-2">Sucursal</th>
                <th className="py-4 pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user, index) => (
                <tr
                  className="border-b border-gray-200 text-sm font-light"
                  key={index}
                >
                  <td className="py-4 pr-2 flex flex-row gap-3 items-center text-sm font-light">
                    <Image
                      className="rounded-full"
                      width={50}
                      height={50}
                      src={user.image ?? ''}
                      alt="User Avatar"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {user.name} {user.lastName}
                      </p>
                      <p className="font-light text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 pr-2">
                    {' '}
                    {user.UserRole.map((ur) => getRoleLabel(ur.role.name)).join(
                      ', ',
                    )}
                  </td>
                  <td className="py-4 pr-2">{user.Branch?.name}</td>
                  <td className="py-4">
                    <button
                      className="rounded-md border font-medium border-sky-500 text-sky-500 mr-4 py-2 px-4 hover:bg-sky-500 hover:text-white transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(user);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-md border font-medium border-pink-500 text-pink-500 mr-4 py-2 px-4 hover:bg-pink-500 hover:text-white transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDeleteModal(user);
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editIsOpen && (
          <UpdateUserModal
            isOpen={editIsOpen}
            onClose={closeEditModal}
            selectedUser={selectedUser}
          />
        )}

        {deleteIsOpen && selectedUser?.id !== currentUser?.id && (
          <DeleteUserModal
            isOpen={deleteIsOpen}
            onClose={closeDeleteModal}
            selectedUser={selectedUser}
          />
        )}

        {deleteIsOpen && selectedUser?.id === currentUser?.id && (
          <ErrorDeletingUser isOpen={deleteIsOpen} onClose={closeDeleteModal} />
        )}
      </Layout>
    </>
  );
}
