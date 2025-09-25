import Image from 'next/image';

export function MintIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className="flex-shrink-0 rounded-full"
    />
  );
}
