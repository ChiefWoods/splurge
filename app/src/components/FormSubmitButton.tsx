import {
  ComponentProps,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import { Button } from './ui/button';
import { LucideProps } from 'lucide-react';

type ButtonProps = ComponentProps<typeof Button>;

type FormSubmitButtonProps = Omit<ButtonProps, 'children'> & {
  disabled: boolean;
  text: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
};

export function FormSubmitButton({
  disabled,
  text,
  Icon,
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button type="submit" size={'sm'} disabled={disabled} {...props}>
      <Icon className="size-4" />
      {text}
    </Button>
  );
}
