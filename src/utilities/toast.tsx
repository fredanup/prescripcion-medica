import { useEffect } from 'react';

export function Toast({
  open,
  type = 'success', // 'success' | 'error' | 'info'
  message,
  onClose,
  duration = 2600,
}: {
  open: boolean;
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const style =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className={`rounded-xl border ${style} shadow-sm px-4 py-3 text-sm`}>
        {message}
      </div>
    </div>
  );
}
