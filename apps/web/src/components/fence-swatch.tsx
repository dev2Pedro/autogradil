import type { FenceColor } from '@autogradil/shared';
import { EDGE_BY_COLOR, POST_BY_COLOR } from '@/lib/fence-colors';
import { cn } from '@/lib/utils';

export function FenceSwatch({ color, className }: { color: FenceColor; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-3 shrink-0 rounded-[3px] border', className)}
      style={{ backgroundColor: POST_BY_COLOR[color], borderColor: EDGE_BY_COLOR[color] }}
    />
  );
}
