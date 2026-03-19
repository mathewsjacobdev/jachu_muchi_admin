import * as React from "react";

import { cn } from "@/lib/utils";

export type ResponsiveTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  renderMobile?: (row: T) => React.ReactNode;
  cellClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export type ResponsiveTableProps<T> = {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  renderActions?: (row: T) => React.ReactNode;
};

const getRowKey = <T,>(row: T, index: number): string | number => {
  const anyRow = row as any;
  return anyRow?.id ?? anyRow?._id ?? index;
};

const getColumnValue = <T,>(row: T, col: ResponsiveTableColumn<T>): React.ReactNode => {
  if (col.render) return col.render(row);
  return (row as any)?.[col.key] ?? "";
};

export function ResponsiveTable<T>({ data, columns, renderActions }: ResponsiveTableProps<T>) {
  return (
    <div className="w-full">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 text-white/80 shadow-lg backdrop-blur-xl">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-white/5">
            <tr className="border-b text-left transition-colors duration-200 hover:bg-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50"
                >
                  {col.header}
                </th>
              ))}
              {renderActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/50">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {data.map((row, index) => {
              const rowKey = getRowKey(row, index);
              return (
                <tr
                  key={rowKey}
                  className="transition-colors duration-200 hover:bg-white/10"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-4 whitespace-nowrap", col.cellClassName)}
                    >
                      {getColumnValue(row, col)}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const rowKey = getRowKey(row, index);
          return (
            <div
              key={rowKey}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 space-y-2 shadow-md"
            >
              {columns.map((col, colIndex) => {
                const value =
                  col.renderMobile?.(row) ??
                  (col.render ? col.render(row) : (row as any)?.[col.key] ?? "");

                const labelClass = cn(
                  "text-xs font-semibold uppercase tracking-wide text-gray-300",
                  col.labelClassName,
                );

                const valueClass = cn(
                  colIndex === 0 ? "font-bold text-gray-100" : "text-sm text-gray-200",
                  col.valueClassName,
                );

                return (
                  <div key={col.key} className="space-y-1">
                    <div className={labelClass}>{col.header}</div>
                    <div className={valueClass}>{value}</div>
                  </div>
                );
              })}

              {renderActions && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">{renderActions(row)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

