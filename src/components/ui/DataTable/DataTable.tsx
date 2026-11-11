import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader } from '../Feedback';

const estimateTicketRowHeight = () => 56;

export interface ColumnDefinition<T> {
  key: keyof T | string;
  header: ReactNode;
  accessor?: (row: T) => unknown;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  sortable?: boolean;
  sortLabel?: string;
  className?: string;
  width?: string;
  dataLabel?: string;
}

export interface DataTablePaginationConfig {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export interface DataTableRowSelection<T> {
  getRowId?: (row: T) => string;
  selectedIds?: string[];
  onSelect?: (row: T, isSelected: boolean) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  emptyMessage?: ReactNode;
  caption?: string;
  onRowClick?: (row: T, index: number) => void;
  rowActions?: (row: T, index: number) => ReactNode;
  getRowId?: (row: T) => string;
  className?: string;
  tableClassName?: string;
  pagination?: DataTablePaginationConfig;
  rowSelection?: DataTableRowSelection<T>;
  initialSort?: { key: keyof T | string; direction?: 'asc' | 'desc' } | null;
  virtualized?: boolean;
}

function getColumnValue<T>(row: T, column: Pick<ColumnDefinition<T>, 'key' | 'accessor'>): unknown {
  if (column.accessor) return column.accessor(row);

  if (typeof row === 'object' && row !== null) {
    const rowValue = row[column.key as keyof T];
    return rowValue;
  }

  return undefined;
}

function sortValues<T>(
  a: T,
  b: T,
  column: ColumnDefinition<T>,
  direction: 'asc' | 'desc',
) {
  const left = getColumnValue(a, column);
  const right = getColumnValue(b, column);

  if (left === right) return 0;

  const comparator = (leftValue: unknown, rightValue: unknown) => {
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return Number(leftValue) - Number(rightValue);
    }

    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
  };

  const result = comparator(left, right);
  return direction === 'asc' ? result : -result;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No results found.',
  caption,
  onRowClick,
  rowActions,
  getRowId,
  className = '',
  tableClassName = '',
  pagination,
  rowSelection,
  initialSort = null,
  virtualized = false,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(
    initialSort
      ? { key: initialSort.key, direction: initialSort.direction ?? 'asc' }
      : null,
  );

  const [internalPage, setInternalPage] = useState(1);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const getScrollElement = useCallback(() => scrollElementRef.current, []);
  const pageSize = pagination?.pageSize ?? (data.length || 10);
  const currentPage = pagination?.page ?? internalPage;

  const sortedData = useMemo(() => {
    const rows = [...data];

    if (!sortState) return rows;
    const column = columns.find((item) => item.key === sortState.key);
    if (!column) return rows;

    rows.sort((left, right) => sortValues(left, right, column, sortState.direction));
    return rows;
  }, [columns, data, sortState]);

  const totalItems = pagination?.totalItems ?? sortedData.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 0) / Math.max(pageSize, 1)));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [pagination, pageSize, safePage, sortedData]);

  const visibleRows = pagination ? paginatedData : sortedData;
  const virtualizer = useVirtualizer({
    count: virtualized ? visibleRows.length : 0,
    getScrollElement,
    estimateSize: estimateTicketRowHeight,
    initialRect: { width: 800, height: 520 },
    overscan: 6,
    enabled: virtualized,
  });
  const virtualItems = virtualized ? virtualizer.getVirtualItems() : [];
  const topSpacerHeight = virtualItems[0]?.start ?? 0;
  const bottomSpacerHeight = virtualized && virtualItems.length
    ? Math.max(0, virtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0))
    : 0;

  const handleSort = (column: ColumnDefinition<T>) => {
    if (!column.sortable) return;

    setSortState((current) => {
      if (current?.key === column.key) {
        return {
          key: column.key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key: column.key, direction: 'asc' };
    });
  };

  const handlePageChange = (nextPage: number) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  const selectedIds = rowSelection?.selectedIds ?? [];
  const selectionEnabled = Boolean(rowSelection?.onSelect);

  const toggleCheck = (row: T) => {
    if (!rowSelection?.onSelect) return;

    const rowId = rowSelection.getRowId?.(row) ?? getRowId?.(row) ?? JSON.stringify(row) ?? '';
    const isSelected = selectedIds.includes(rowId);
    rowSelection.onSelect(row, !isSelected);
  };

  if (loading) {
    return <div className={`data-table ${className}`.trim()}><Loader /></div>;
  }

  if (!visibleRows.length) {
    return <div className={`data-table data-table--empty ${className}`.trim()}>{emptyMessage}</div>;
  }

  return (
    <div className={`data-table ${virtualized ? 'data-table--virtualized' : ''} ${className}`.trim()}>
      <div
        ref={scrollElementRef}
        className="data-table__scroll"
        tabIndex={virtualized ? 0 : undefined}
        aria-label={virtualized && caption ? `${caption} list` : undefined}
      >
        <table
          className={tableClassName}
          aria-rowcount={virtualized ? totalItems + 1 : undefined}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {selectionEnabled && <th scope="col">Select</th>}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={column.className}
                  aria-sort={column.sortable && sortState?.key === column.key
                    ? sortState.direction === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      aria-label={`Sort by ${column.sortLabel ?? String(column.key)}`}
                    >
                      {column.header}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {virtualized && topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={columns.length + Number(selectionEnabled) + Number(Boolean(rowActions))}
                  style={{ height: topSpacerHeight, padding: 0, border: 0 }}
                />
              </tr>
            )}
            {(virtualized
              ? virtualItems.map((item) => item.index)
              : visibleRows.map((_, index) => index)
            ).map((rowIndex) => {
              const row = visibleRows[rowIndex];
              const virtualItem = virtualized ? virtualItems.find((item) => item.index === rowIndex) : undefined;
              if (!row) return null;
              const rowId = getRowId?.(row) ?? JSON.stringify(row) ?? String(rowIndex);
              const isSelected = rowSelection ? selectedIds.includes(rowId) : false;

              return (
                <tr
                  key={rowId}
                  data-index={virtualItem?.index}
                  aria-rowindex={virtualized
                    ? (safePage - 1) * pageSize + rowIndex + 2
                    : undefined}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectionEnabled && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${rowId}`}
                        checked={isSelected}
                        onChange={() => toggleCheck(row)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getColumnValue(row, column);
                    const content = column.render
                      ? column.render(value, row, rowIndex)
                      : value == null
                        ? '—'
                        : String(value);

                    return (
                      <td key={`${rowId}-${String(column.key)}`} data-label={column.dataLabel}>
                        {content}
                      </td>
                    );
                  })}
                  {rowActions && <td>{rowActions(row, rowIndex)}</td>}
                </tr>
              );
            })}
            {virtualized && bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={columns.length + Number(selectionEnabled) + Number(Boolean(rowActions))}
                  style={{ height: bottomSpacerHeight, padding: 0, border: 0 }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="data-table__pagination">
          <button type="button" onClick={() => handlePageChange(Math.max(1, safePage - 1))} disabled={safePage <= 1}>
            Previous
          </button>
          <span>
            Page {safePage} of {totalPages}
          </span>
          <button type="button" onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
