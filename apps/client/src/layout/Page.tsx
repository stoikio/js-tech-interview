import type { ReactNode } from 'react';

const widths = { full: '', wide: 'mx-auto max-w-6xl', narrow: 'mx-auto max-w-4xl' };

/** Page content. Tables use the full width, detail and form pages a narrower one. */
export function Page({
  width = 'full',
  children,
}: {
  width?: keyof typeof widths;
  children: ReactNode;
}) {
  return <div className={`p-4 pb-24 ${widths[width]}`}>{children}</div>;
}
