import type { PaginationParams } from "@/types";

export function calculatePagination(
  page: number,
  limit: number
): PaginationParams {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.max(1, Math.min(100, limit));
  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset,
  };
}

export function hasMorePages(total: number, page: number, limit: number): boolean {
  return total > page * limit;
}

export function getTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
