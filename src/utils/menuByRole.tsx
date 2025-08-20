import {
  User,
  FileText,
  Calendar,
  Pill,
  Bell,
  FlaskConical,
} from 'lucide-react';

export const menuByRole = {
  admin: [{ label: 'Usuarios', path: '/dashboard/users', icon: User }],
  doctor: [
    { label: 'Agenda', path: '/dashboard/callings', icon: Calendar },
    { label: 'Pacientes', path: '/dashboard/patients', icon: User },
    { label: 'Historial Clínico', path: '/dashboard/records', icon: FileText },
  ],
  patient: [
    { label: 'Mi Perfil', path: '/dashboard/profile', icon: User },
    { label: 'Historial Clínico', path: '/dashboard/history', icon: FileText },

    { label: 'Citas', path: '/dashboard/appointments', icon: Calendar },
  ],
  laboratory_staff: [
    {
      label: 'Órdenes Pendientes',
      path: '/dashboard/lab-orders',
      icon: FlaskConical,
    },
    {
      label: 'Cargar Resultados',
      path: '/dashboard/upload-results',
      icon: FileText,
    },
    {
      label: 'Historial de Resultados',
      path: '/dashboard/lab-history',
      icon: FileText,
    },
    {
      label: 'Reportes de Laboratorio',
      path: '/dashboard/lab-reports',
      icon: FileText,
    },
  ],
  pharmacist: [
    {
      label: 'Recetas Pendientes',
      path: '/dashboard/prescriptions',
      icon: Pill,
    },
    {
      label: 'Entregas Realizadas',
      path: '/dashboard/deliveries',
      icon: FileText,
    },
    { label: 'Inventario', path: '/dashboard/inventory', icon: FileText },
    { label: 'Alertas de Stock', path: '/dashboard/stock-alerts', icon: Bell },
  ],
};
