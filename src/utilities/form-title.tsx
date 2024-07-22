export default function FormTitle({ text }: { text: string }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-black text-center md:text-center">
      {text}
    </h2>
  );
}
