export function getOrderStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente',
      received: 'Recibido',
      in_process: 'En Proceso',
      reported: 'Reportado',
      cancelled: 'Cancelado',
    };
  
    return statusMap[status] || 'Desconocido';
  }
  

