import { ComponentProps, ReactNode } from 'react';
import { TableRow } from './ui/table';

type TableRowProps = ComponentProps<typeof TableRow>;

type OrderTableRowProps = Omit<TableRowProps, 'children'> & {
  children: ReactNode;
};

export function OrderTableRow({ children, ...props }: OrderTableRowProps) {
  return (
    <TableRow className="hover:bg-transparent" {...props}>
      {children}
    </TableRow>
  );
}
