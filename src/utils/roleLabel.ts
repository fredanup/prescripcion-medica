export function getRoleLabel(role: string): string {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      doctor: 'Doctor',
      pharmacist: 'Farmacéutico',
      patient: 'Paciente',
      laboratory_staff: 'Laboratorista'
    };
  
    return roleMap[role] || 'Desconocido';
  }
  