export default function Spinner({ text }: { text: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-3 bg-[#F7F7F8]">
      <svg
        className="animate-spin w-10 h-10 text-[#2563EB]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="text-sm text-[#374151] font-medium">{text}</p>
    </div>
  );
}
