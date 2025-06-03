import FormTitle from 'utilities/form-title';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { trpc } from 'utils/trpc';
import { IBranch } from 'utils/auth';

export default function CreateBranchModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (branch: IBranch) => void;
}) {
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const utils = trpc.useContext();
  const createBranch = trpc.branch.createBranch.useMutation({
    onSuccess: async (newBranch) => {
      await utils.branch.findMany.invalidate();
      onCreate(newBranch);
      onClose();
      setName('');
      setAddress('');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const branchData = {
      name: name,
      address: address,
    };

    createBranch.mutate(branchData);
  };
  if (!isOpen) {
    return null; // No renderizar el modal si no está abierto
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center z-30">
      <form
        className="w-11/12 md:w-1/2 flex flex-col gap-2 rounded-lg bg-white p-6 drop-shadow-lg"
        onSubmit={handleSubmit}
      >
        <FormTitle text="Nueva sucursal" />

        <div className="flex flex-col gap-2">
          <label className="text-black text-sm font-bold">Nombre:</label>
          <input
            type="text"
            className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-black text-sm font-bold">Dirección:</label>
          <input
            type="text"
            className="focus:shadow-outline w-full appearance-none rounded-lg border px-2 py-1 leading-tight text-gray-700 focus:outline-none"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
          />
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
            className="rounded-lg border bg-sky-500 px-4 py-1 text-base font-medium text-white"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
