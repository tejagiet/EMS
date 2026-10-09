"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useMemo, useState } from "react";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { TableSkeleton } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  initialSortKey?: string;
  initialSortOrder?: "asc" | "desc";
  className?: string;
}

export function DataTable<T extends object>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no rows matching the selected view.",
  pageSize = 10,
  initialSortKey,
  initialSortOrder = "asc",
  className = "",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortKey];
      const valB = (b as Record<string, unknown>)[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      const strA =
        typeof valA === "string"
          ? valA.toLowerCase()
          : typeof valA === "number" || typeof valA === "boolean"
            ? valA.toString()
            : "";
      const strB =
        typeof valB === "string"
          ? valB.toLowerCase()
          : typeof valB === "number" || typeof valB === "boolean"
            ? valB.toString()
            : "";
      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (isLoading) {
    return <TableSkeleton rows={pageSize} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrapper">
        <table className="ems-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      textAlign: col.align ?? "left",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (col.sortable) {
                        handleSort(col.key);
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        justifyContent:
                          col.align === "right"
                            ? "flex-end"
                            : col.align === "center"
                              ? "center"
                              : "flex-start",
                      }}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span>
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ArrowUp size={13} style={{ color: "var(--primary)" }} />
                            ) : (
                              <ArrowDown size={13} style={{ color: "var(--primary)" }} />
                            )
                          ) : (
                            <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(row)
                    : ((row as Record<string, unknown>)[col.key] as React.ReactNode);
                  return (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align ?? "left",
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedData.length}
        pageSize={pageSize}
        onPageChange={(p) => {
          setCurrentPage(p);
        }}
      />
    </div>
  );
}
