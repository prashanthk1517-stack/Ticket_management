import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
}

export function usePagination(
  totalItems: number,
  options: UsePaginationOptions = {},
): UsePaginationResult {
  const { initialPage = 1, initialPageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [pageSize, setPageSizeState] = useState(Math.max(1, initialPageSize));

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(totalItems, 0) / Math.max(pageSize, 1))),
    [pageSize, totalItems],
  );

  const setPage = useCallback((page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  }, [totalPages]);

  const nextPage = useCallback(() => setPage(currentPage + 1), [currentPage, setPage]);
  const previousPage = useCallback(() => setPage(currentPage - 1), [currentPage, setPage]);
  const setPageSize = useCallback((nextPageSize: number) => {
    const safeSize = Math.max(1, nextPageSize);
    setPageSizeState(safeSize);
    setCurrentPage((existing) => Math.min(existing, Math.max(1, Math.ceil(Math.max(totalItems, 0) / safeSize))));
  }, [totalItems]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    setPage,
    nextPage,
    previousPage,
    setPageSize,
  };
}
