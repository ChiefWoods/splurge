import { getRelativeTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function TimestampTooltip({ timestamp }: { timestamp: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{getRelativeTime(timestamp)}</span>
      </TooltipTrigger>
      <TooltipContent>
        <span>
          {new Date(timestamp * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ')}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
