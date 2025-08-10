export default function FormTitle({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between pb-2 ">
      <h2 className="text-2xl font-bold text-[#374151]">{text}</h2>
    </div>
  );
}
