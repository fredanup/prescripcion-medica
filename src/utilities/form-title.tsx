export default function FormTitle({ text }: { text: string }) {
  return (
    <div className="flex flex-row justify-between items-center">
      <h2 className="text-2xl md:text-2xl font-bold text-black text-center md:text-center">
        {text}
      </h2>
    </div>
  );
}
