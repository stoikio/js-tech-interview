import type { ReactNode } from 'react';

type Props = { title?: ReactNode; actions?: ReactNode; children: ReactNode };

export function Card({ title, actions, children }: Props) {
  return (
    <section className="border-gray-2 rounded-md border bg-white">
      {title && (
        <header className="border-gray-2 flex min-h-[57px] items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-base font-medium">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
