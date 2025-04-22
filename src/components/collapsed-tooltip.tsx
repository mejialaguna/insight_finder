import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CollapsedTooltip({
  children,
  tooltip,
  isCollapsed,
}: {
  children: React.ReactNode;
  tooltip: string;
  isCollapsed: boolean;
}) {
  if (!isCollapsed) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
