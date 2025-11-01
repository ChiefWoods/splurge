export enum DicebearStyles {
  Shopper = 'personas',
  Store = 'shapes',
  Item = 'icons',
}

export function getDicebearEndpoint(style: string, seed: string = ''): string {
  return `${process.env.NEXT_PUBLIC_DICEBEAR_API}/${style}/svg?seed=${seed}`;
}

export async function getDicebearFile(
  style: string,
  seed: string = ''
): Promise<File> {
  const res = await fetch(getDicebearEndpoint(style, seed), {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

  const file = await res.blob();

  return new File([file], seed, { type: file.type });
}
