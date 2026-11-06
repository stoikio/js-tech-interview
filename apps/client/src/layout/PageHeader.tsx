import type { Icon } from '@tabler/icons-react';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';

type Crumb = { label: string; to?: string };

type Props = {
  icon: Icon;
  breadcrumbs: Crumb[];
  /** Shown right after the breadcrumbs, such as a status badge. */
  status?: ReactNode;
  children?: ReactNode;
};

/**
 * Sticky top bar of a page: icon, breadcrumbs and status on the left, actions on the right.
 * Sets the document title.
 */
export function PageHeader({ icon: Icon, breadcrumbs, status, children }: Props) {
  const title = breadcrumbs.map((crumb) => crumb.label).reverse();
  return (
    <header className="border-gray-2 sticky top-0 z-40 flex h-[50px] shrink-0 items-center justify-between gap-4 border-b bg-white/75 px-4 backdrop-blur-md">
      <title>{`${title.join(' – ')} | Stoïk Lite`}</title>
      <div className="flex min-w-0 items-center gap-1 font-medium">
        <Icon aria-hidden size={20} stroke={1.5} className="mr-1 shrink-0" />
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && (
              <span aria-hidden className="text-gray">
                /
              </span>
            )}
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="text-gray-7 hover:bg-gray-1 max-w-[20vw] truncate rounded-sm p-1"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="min-w-0 truncate p-1">
                {crumb.label}
              </span>
            )}
          </Fragment>
        ))}
        {status && <span className="ml-2 shrink-0">{status}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}
