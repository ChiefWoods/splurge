import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info size={16} />
      </TooltipTrigger>
      <TooltipContent>
        <span>{text}</span>
      </TooltipContent>
    </Tooltip>
  );
}
