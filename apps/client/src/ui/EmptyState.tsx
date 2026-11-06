import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, children }: { icon: Icon; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 bg-white p-10 text-center">
      <span className="bg-gray-1 text-gray-6 flex size-8 items-center justify-center rounded-sm shadow-md">
        <Icon aria-hidden size={20} stroke={1.5} />
      </span>
      <div className="text-gray-6 flex flex-col items-center">{children}</div>
    </div>
  );
}
