import { Info } from 'lucide-react';
import { FormLabel } from './ui/form';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ImageInputLabel() {
  return (
    <FormLabel className="flex items-center gap-1">
      <span>Image</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={16} />
        </TooltipTrigger>
        <TooltipContent>
          <span>
            When uploading images, you'll be prompted to sign twice; one for
            paying an upload fee, another as a generic message signing.
          </span>
        </TooltipContent>
      </Tooltip>
    </FormLabel>
  );
}
