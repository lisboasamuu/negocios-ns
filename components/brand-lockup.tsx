import Image from "next/image";

export function BrandLockup({ priority = false }: { priority?: boolean }) {
  return (
    <>
      <Image className="brand-symbol" src="/favicon.svg" alt="" width={40} height={40} priority={priority} />
      <span className="brand-name">Clínica <strong>Lisboa</strong></span>
    </>
  );
}
