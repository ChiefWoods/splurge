import { useMobile } from '@/hooks/useMobile';
import Image from 'next/image';

export function LargeImage({ src, alt }: { src: string; alt: string }) {
  const { isMobile } = useMobile();

  return (
    <Image
      src={src}
      alt={alt}
      width={isMobile ? 100 : 200}
      height={isMobile ? 100 : 200}
      className="aspect-square self-start rounded-lg border md:self-center"
      priority
    />
  );
}
