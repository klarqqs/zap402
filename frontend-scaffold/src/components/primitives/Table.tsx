import React from 'react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  variant?: 'default' | 'editorial';
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  variant = 'default',
}) => {
  const isEditorial = variant === 'editorial';

  const wrapClass = isEditorial
    ? 'w-full overflow-x-auto rounded-xl border border-zap-bg-alt'
    : 'w-full overflow-x-auto border-2 border-black';

  const headRowClass = isEditorial
    ? 'border-b border-zap-bg-alt bg-zap-bg-alt/80 text-zap-ink'
    : 'bg-black text-white';

  const thClass = (index: number, col: Column) => {
    const base = `px-4 py-3 text-sm ${alignClass[col.align ?? 'left']}`;
    if (isEditorial) {
      return `${base} font-semibold tracking-wide text-zap-ink border-r border-zap-bg-alt last:border-r-0 ${
        index === 0 ? 'sticky left-0 z-20 bg-zap-bg-alt/95 backdrop-blur-sm' : ''
      }`;
    }
    return `${base} font-black uppercase tracking-wide border-r-2 border-white last:border-r-0 ${
      index === 0 ? 'sticky left-0 z-20 bg-black' : ''
    }`;
  };

  const trClass = (i: number) => {
    if (isEditorial) {
      return [
        i % 2 === 0 ? 'bg-zap-surface' : 'bg-zap-bg-alt/30',
        'border-t border-zap-bg-alt transition-colors',
        onRowClick ? 'cursor-pointer hover:bg-zap-brand/5' : '',
      ].join(' ');
    }
    return [
      i % 2 === 0 ? 'bg-white' : 'bg-gray-50',
      'border-t-2 border-black transition-transform duration-150',
      onRowClick
        ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5'
        : '',
    ].join(' ');
  };

  const tdClass = (index: number) => {
    const base = `px-4 py-3 text-sm ${alignClass[columns[index].align ?? 'left']}`;
    if (isEditorial) {
      return `${base} border-r border-zap-bg-alt/80 last:border-r-0 text-zap-ink ${
        index === 0 ? 'sticky left-0 z-10 bg-inherit' : ''
      }`;
    }
    return `${base} border-r-2 border-black last:border-r-0 ${
      index === 0 ? 'sticky left-0 z-10 bg-inherit' : ''
    }`;
  };

  return (
    <div className={wrapClass}>
      <table className="w-full min-w-max border-collapse">
        <thead>
          <tr className={headRowClass}>
            {columns.map((col, index) => (
              <th key={col.key} className={thClass(index, col)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={trClass(i)}
            >
              {columns.map((col, index) => (
                <td key={col.key} className={tdClass(index)}>
                  {(row[col.key] as React.ReactNode) ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
