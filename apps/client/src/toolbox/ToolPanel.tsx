import { IconX, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { IconButton } from '../ui/IconButton';

type Props = {
  title: string;
  icon: Icon;
  /**
   * `sheet`: a side panel, the app stays usable. `full`: almost the whole window.
   * `card`: a small window in the lower right corner.
   */
  layout: 'sheet' | 'full' | 'card';
  /** Keyboard shortcut that also closes the panel, shown in the close button's tooltip. */
  shortcut: string;
  onClose: () => void;
  children: ReactNode;
};

const layoutClasses = {
  sheet: 'top-2 right-2 bottom-2 w-[min(540px,calc(100vw-1rem))]',
  full: 'inset-2',
  card: 'right-4 bottom-4 max-h-[min(560px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))]',
};

// z-50 like the popups (select, menu, tooltip) of the panels: portalled at the end of <body>, they stay on top.
export function ToolPanel({ title, icon: Icon, layout, shortcut, onClose, children }: Props) {
  return (
    <aside
      aria-label={title}
      data-toolbox
      className={`animate-enter border-gray-2 fixed z-50 flex flex-col overflow-hidden rounded-md border bg-white shadow-lg ${
        layoutClasses[layout]
      }`}
    >
      <header className="border-gray-2 flex h-12 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
        <h2 className="flex items-center gap-2 font-medium">
          <Icon aria-hidden size={18} stroke={1.5} />
          {title}
        </h2>
        <IconButton label={`Close (${shortcut})`} onClick={onClose}>
          <IconX aria-hidden size={18} stroke={1.5} />
        </IconButton>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </aside>
  );
}
