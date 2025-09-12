const DicebearStyles: Map<string, string> = new Map([
  ['shopper', 'personas'],
  ['store', 'shapes'],
  ['item', 'icons'],
]);

export function getDicebearEndpoint(type: string) {
  const style = DicebearStyles.get(type);

  if (!style) {
    throw new Error('Invalid type');
  }

  return `${process.env.NEXT_PUBLIC_DICEBEAR_API}/${style}/svg`;
}
