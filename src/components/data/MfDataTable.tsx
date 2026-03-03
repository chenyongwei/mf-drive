import type { ReactNode } from 'react';

export type MfDataColumn<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
};

type MfDataTableProps<T> = {
  columns: Array<MfDataColumn<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function MfDataTable<T>(props: MfDataTableProps<T>) {
  const { columns, rows, rowKey, emptyText = '暂无数据', className } = props;

  return (
    <div className={cx('overflow-auto rounded-lg border border-mf-border', className)}>
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-mf-bg-soft">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cx('border-b border-mf-border px-2 py-2 text-left font-semibold text-mf-muted', column.headerClassName)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-b border-mf-border/70 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className={cx('px-2 py-2 text-mf-text', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-xs text-mf-muted">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
