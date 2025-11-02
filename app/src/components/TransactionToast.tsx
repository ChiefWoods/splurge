export function TransactionToast({
  title,
  link,
}: {
  title: string;
  link: string;
}) {
  return (
    <div className="flex flex-col">
      <a href={link} target="_blank" className="text-info underline">
        {title}
      </a>
    </div>
  );
}
