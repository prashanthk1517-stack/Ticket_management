import { useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactElement, RefObject } from 'react';

interface VirtualizedRowsProps {
  count: number;
  columnCount: number;
  renderRow: (index: number) => ReactElement | null;
  scrollElementRef: RefObject<HTMLDivElement | null>;
}

const estimateTicketRowHeight = () => 56;

export function VirtualizedRows({
  count,
  columnCount,
  renderRow,
  scrollElementRef,
}: VirtualizedRowsProps) {
  const getScrollElement = useCallback(() => scrollElementRef.current, [scrollElementRef]);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize: estimateTicketRowHeight,
    initialRect: { width: 800, height: 520 },
    overscan: 6,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const topSpacerHeight = virtualItems[0]?.start ?? 0;
  const bottomSpacerHeight = virtualItems.length
    ? Math.max(0, virtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0))
    : 0;

  return (
    <>
      {topSpacerHeight > 0 && (
        <tr aria-hidden="true">
          <td
            colSpan={columnCount}
            style={{ height: topSpacerHeight, padding: 0, border: 0 }}
          />
        </tr>
      )}
      {virtualItems.map((item) => renderRow(item.index))}
      {bottomSpacerHeight > 0 && (
        <tr aria-hidden="true">
          <td
            colSpan={columnCount}
            style={{ height: bottomSpacerHeight, padding: 0, border: 0 }}
          />
        </tr>
      )}
    </>
  );
}
