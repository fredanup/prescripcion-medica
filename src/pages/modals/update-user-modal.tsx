import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { IBranch, IUserBranch } from 'utils/auth';
import { trpc } from 'utils/trpc';
import CreateBranchModal from './create-branch-modal';
import FormTitle from 'utilities/form-title';

export default function UpdateUserModal({
  isOpen,
  onClose,
  selectedUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: IUserBranch | null;
}) {
  const [name, setName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [roles, setRoles] = useState<string[]>([]);

  const [branchId, setBranchId] = useState<string>('');
  const [branchList, setBranchList] = useState<IBranch[]>([]);

  const [isBranchOpen, setIsOpenBranch] = useState(false);
  const utils = trpc.useContext();
  //Mutación para la base de datos
  //Obtener todos los usuarios creados con su sucursal
  const { data: branchs } = trpc.branch.findMany.useQuery(undefined, {
    enabled: isOpen, // ⚠️ Esto asegura que se ejecute solo si el modal está abierto
  });
  const { data: allRoles } = trpc.role.findAll.useQuery(undefined, {
    enabled: isOpen, // solo si el modal está abierto
  });

  const updateUser = trpc.user.updateUser.useMutation({
    onSettled: async () => {
      await utils.user.findManyUserBranch.invalidate();
    },
  });

  useEffect(() => {
    if (branchs) setBranchList(branchs);
  }, [branchs]);

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name!);
      setLastName(selectedUser.lastName!);
      const roleNames = selectedUser.UserRole?.map((ur) => ur.role.name) ?? [];
      setRoles(roleNames);

      if (selectedUser.branchId) setBranchId(selectedUser.branchId);
    }
  }, [selectedUser]);

  const handleBranchCreated = (branch: IBranch) => {
    setBranchId(branch.id);
    setBranchList((prev) => [...prev, branch]);
  };

  //Función de selección de registro y apertura de modal de edición
  const openBranchModal = () => {
    setIsOpenBranch(true);
  };
  //Función de cierre de modal de edición
  const closeBranchModal = () => {
    setIsOpenBranch(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userData = {
      name,
      lastName,
      roles, // 👈 ahora enviamos un arreglo de strings
      branchId,
    };

    if (selectedUser !== null) {
      updateUser.mutate({
        id: selectedUser.id,
        ...userData,
      });
    }

    onClose();
    setName('');
    setLastName('');
    setRoles([]); // 👈 importante: limpiar array
    setBranchId('');
    setBranchList([]);
  };

  const isBranchValid =
    branchId !== '' && branchList.some((b) => b.id === branchId);

  if (!isOpen) {
    return null; // No renderizar el modal si no está abierto
  }
  //Estilizado del fondo detrás del modal. Evita al usuario salirse del modal antes de elegir alguna opción
  const overlayClassName = isOpen
    ? 'fixed top-0 left-0 w-full h-full rounded-lg bg-gray-800 opacity-60 z-20'
    : 'hidden';

  return (
    <>
      {/* Fondo borroso y no interactivo */}
      <div className={overlayClassName}></div>
      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-30 w-11/12 md:w-auto overflow-auto rounded-lg bg-white p-9"
      >
        <div className="flex flex-col gap-2">
          <FormTitle text="Editar usuario" />
          <p className="text-justify text-base font-light text-gray-500">
            Complete los campos presentados a continuación:
          </p>

          {/**CUERPO 1*/}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-bold">Nombres</label>
            <input
              type="text"
              className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-bold">Apellidos</label>
            <input
              type="text"
              className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          {/**Rol combo */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-bold">Roles</label>
            <div className="flex flex-col gap-1">
              {allRoles?.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoles((prev) => [...prev, role.name]);
                      } else {
                        setRoles((prev) => prev.filter((r) => r !== role.name));
                      }
                    }}
                  />
                  <span>{role.description || role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-row justify-between items-center">
              <label className="text-black text-sm font-bold">Sucursal:</label>
              <svg
                viewBox="0 0 512 512"
                className={`h-8 w-8 cursor-pointer fill-black p-1.5  `}
                onClick={(event) => {
                  event.stopPropagation();
                  openBranchModal();
                }}
              >
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
              </svg>
            </div>

            <div>
              <select
                className="block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
              >
                {selectedUser?.branchId === null && (
                  <>
                    <option value="">Seleccionar</option>
                  </>
                )}
                {branchList?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 flex flex-row justify-end gap-2 border-t border-gray-200">
            <button
              type="button"
              className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isBranchValid}
              className={`px-4 py-1 rounded text-white ${
                isBranchValid ? 'bg-sky-500' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
      {isBranchOpen && (
        <CreateBranchModal
          isOpen={isBranchOpen}
          onClose={closeBranchModal}
          onCreate={handleBranchCreated}
        />
      )}
    </>
  );
}
