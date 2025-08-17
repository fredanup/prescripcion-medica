export function BlockingLoader({
  show,
  text = 'Procesando…',
}: {
  show: boolean;
  text?: string;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/5">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-[#E4E8EB] rounded-xl shadow-sm px-4 py-3 flex items-center gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E4E8EB" strokeWidth="3" />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="#2563EB"
              strokeWidth="3"
            />
          </svg>
          <span className="text-sm text-[#374151]">{text}</span>
        </div>
      </div>
    </div>
  );
}
