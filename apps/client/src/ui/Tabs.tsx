import { Link } from 'react-router';

export type TabItem = { label: string; count?: number; to: string; active: boolean };

/** Tabs that are links, so the selected tab lives in the URL. */
export function Tabs({ label, items }: { label: string; items: TabItem[] }) {
  return (
    <nav aria-label={label} className="border-gray-2 flex h-10 gap-5 overflow-x-auto border-b">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          replace
          aria-current={item.active ? 'page' : undefined}
          className={`flex items-center gap-1.5 whitespace-nowrap ${
            item.active
              ? 'text-blue shadow-[inset_0_-2px_0_var(--color-blue)]'
              : 'text-gray-7 hover:text-gray-9'
          }`}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={`rounded-xs px-1 text-xs tabular-nums ${item.active ? 'bg-blue-0' : 'bg-gray-1'}`}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
