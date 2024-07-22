import Image from 'next/image';

export default function FormTitle({ text }: { text: string }) {
  return (
    <div className="flex flex-row justify-between items-center">
      <h2 className="text-2xl md:text-3xl font-bold text-black text-center md:text-center">
        {text}
      </h2>
      <Image src="/logo.png" width={65} height={65} alt="Logo" />
    </div>
  );
}
