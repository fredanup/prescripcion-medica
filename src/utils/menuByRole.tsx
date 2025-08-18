import {
  User,
  FileText,
  Settings,
  Calendar,
  Pill,
  Bell,
  FlaskConical,
} from 'lucide-react';

export const menuByRole = {
  admin: [
    { label: 'Usuarios', path: '/dashboard/users', icon: User },

    { label: 'Auditoría', path: '/dashboard/audit', icon: FileText },
    { label: 'Reportes', path: '/dashboard/reports', icon: FileText },
    { label: 'Configuración', path: '/dashboard/settings', icon: Settings },
  ],
  doctor: [
    { label: 'Agenda', path: '/dashboard/callings', icon: Calendar },
    { label: 'Pacientes', path: '/dashboard/patients', icon: User },
    { label: 'Órdenes Médicas', path: '/dashboard/orders', icon: FileText },
    { label: 'Historial Clínico', path: '/dashboard/records', icon: FileText },
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
  patient: [
    { label: 'Mi Perfil', path: '/dashboard/profile', icon: User },
    { label: 'Historial Clínico', path: '/dashboard/history', icon: FileText },
    { label: 'Resultados', path: '/dashboard/results', icon: FileText },
    { label: 'Citas', path: '/dashboard/appointments', icon: Calendar },
    { label: 'Notificaciones', path: '/dashboard/notifications', icon: Bell },
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
};
