import Image from 'next/image';

export function LargeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      className="aspect-square size-25 self-start rounded-lg border md:size-50 md:self-center"
      priority
    />
  );
}
