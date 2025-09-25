import Image from 'next/image';

export function LargeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      className="aspect-square self-center rounded-lg border"
      priority
    />
  );
}
