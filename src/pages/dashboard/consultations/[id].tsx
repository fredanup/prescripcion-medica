import { useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from 'utils/trpc';
import Layout from 'utilities/layout';
import FormTitle from 'utilities/form-title';

export default function ConsultationForm() {
  const router = useRouter();
  const { id: appointmentId } = router.query;

  const utils = trpc.useContext();

  const createConsultation = trpc.consultation.create.useMutation({
    onSuccess: async () => {
      alert('Consulta registrada correctamente.');
      await utils.appointment.findDoctorAppointmentsByDate.invalidate();
      router.push('/dashboard/callings');
    },
    onError: (error) => {
      console.error('Error al registrar consulta:', error);
      alert('No se pudo registrar la consulta: ' + error.message);
    },
  });

  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [indications, setIndications] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState([
    { medication: '', dosage: '', frequency: '', duration: '', route: '' },
  ]);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: '', dosage: '', frequency: '', duration: '', route: '' },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof appointmentId !== 'string' || !appointmentId) {
      alert('Cita no válida. ID: ' + appointmentId);
      return;
    }

    if (prescriptions.some((p) => !p.medication.trim())) {
      alert('Todos los medicamentos deben tener nombre.');
      return;
    }

    const transformedIndications = indications.map((ind) => ({
      instruction: ind,
      notes: '',
    }));

    createConsultation.mutate({
      appointmentId,
      reason,
      diagnosis,
      plan,
      notes,
      indications: transformedIndications,
      prescriptions: prescriptions.map((rx) => ({
        medication: rx.medication,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        route: rx.route,
      })),
    });
  };

  if (!router.isReady) return <div className="p-4">Cargando...</div>;

  return (
    <Layout>
      <FormTitle text="Atención Médica" />
      <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-4xl text-sm">
        <div>
          <label className="block font-semibold mb-1">
            Motivo de consulta:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Diagnóstico:</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Plan:</label>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Notas adicionales:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Indicaciones generales:
          </label>
          <textarea
            onChange={(e) => setIndications(e.target.value.split('\n'))}
            placeholder="Una por línea"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Recetas médicas:</label>
          {prescriptions.map((pres, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
              {['medication', 'dosage', 'frequency', 'duration', 'route'].map(
                (field) => (
                  <input
                    key={field}
                    placeholder={
                      field === 'medication'
                        ? 'Medicamento'
                        : field.charAt(0).toUpperCase() + field.slice(1)
                    }
                    value={pres[field as keyof typeof pres]}
                    onChange={(e) => {
                      const copy = [...prescriptions];
                      copy[idx][field as keyof typeof pres] = e.target.value;
                      setPrescriptions(copy);
                    }}
                    required={field === 'medication'}
                    className="border rounded px-2 py-1"
                  />
                ),
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPrescription}
            className="text-blue-600 hover:underline mt-2"
          >
            + Agregar otro medicamento
          </button>
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-6 py-2 rounded shadow"
          >
            Guardar consulta
          </button>
        </div>
      </form>
    </Layout>
  );
}
