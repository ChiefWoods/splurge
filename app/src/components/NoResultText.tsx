export function NoResultText({ text }: { text: string }) {
  return (
    <p className="my-auto w-full text-center text-secondary-foreground">
      {text}
    </p>
  );
}
