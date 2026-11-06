import type { ReactNode } from 'react';
import { Link } from 'react-router';

type Align = { align?: 'left' | 'right' };

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="border-gray-2 overflow-x-auto rounded-md border bg-white">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, align = 'left' }: Align & { children?: ReactNode }) {
  return (
    <th
      className={`border-gray-1 text-gray-6 border-b p-3 text-xs font-medium whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = 'left' }: Align & { children?: ReactNode }) {
  return (
    <td
      className={`border-gray-1 h-12 border-b border-l px-3 py-2 first:border-l-0 ${align === 'right' ? 'text-right tabular-nums' : ''}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-gray-0 relative bg-white last:[&>td]:border-b-0">{children}</tr>;
}

/** A link that makes its whole row clickable. */
export function RowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="hover:text-blue inline-block min-w-36 font-medium after:absolute after:inset-0"
    >
      {children}
    </Link>
  );
}
