// pages/consulta/[appointmentId].tsx
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
      alert('Cita no válida.' + appointmentId);
      return;
    }

    if (prescriptions.some((p) => !p.medication.trim())) {
      alert('Todos los medicamentos deben tener nombre.');
      return;
    }

    const transformedIndications = indications.map((ind) => ({
      instruction: ind,
      notes: '', // opcional
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

  if (!router.isReady) return <div>Cargando...</div>;

  return (
    <Layout>
      <FormTitle text="Atención Médica" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Motivo de consulta:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Diagnóstico:</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        <div>
          <label>Plan:</label>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Notas adicionales:</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <label>Indicaciones generales:</label>
          <textarea
            onChange={(e) => setIndications(e.target.value.split('\n'))}
            placeholder="Una por línea"
          />
        </div>

        <div>
          <label>Recetas médicas:</label>
          {prescriptions.map((pres, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 mt-2">
              <input
                placeholder="Medicamento"
                value={pres.medication}
                onChange={(e) => {
                  const copy = [...prescriptions];
                  copy[idx].medication = e.target.value;
                  setPrescriptions(copy);
                }}
                required
              />
              <input
                placeholder="Dosis"
                value={pres.dosage}
                onChange={(e) => {
                  const copy = [...prescriptions];
                  copy[idx].dosage = e.target.value;
                  setPrescriptions(copy);
                }}
              />
              <input
                placeholder="Frecuencia"
                value={pres.frequency}
                onChange={(e) => {
                  const copy = [...prescriptions];
                  copy[idx].frequency = e.target.value;
                  setPrescriptions(copy);
                }}
              />
              <input
                placeholder="Duración"
                value={pres.duration}
                onChange={(e) => {
                  const copy = [...prescriptions];
                  copy[idx].duration = e.target.value;
                  setPrescriptions(copy);
                }}
              />
              <input
                placeholder="Vía"
                value={pres.route}
                onChange={(e) => {
                  const copy = [...prescriptions];
                  copy[idx].route = e.target.value;
                  setPrescriptions(copy);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addPrescription}
            className="text-blue-600 mt-2"
          >
            + Agregar otro medicamento
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Guardar consulta
        </button>
      </form>
    </Layout>
  );
}
