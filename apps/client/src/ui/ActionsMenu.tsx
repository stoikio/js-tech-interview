import { Menu as BaseMenu } from '@base-ui/react/menu';
import { IconDots, type Icon } from '@tabler/icons-react';

export type MenuAction = {
  label: string;
  icon: Icon;
  tone?: 'danger';
  onSelect: () => void;
};

/** "More actions" menu built on Base UI: keyboard navigation and focus return included. */
export function ActionsMenu({ actions }: { actions: MenuAction[] }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        aria-label="More actions"
        className="text-gray-7 hover:bg-gray-1 data-[popup-open]:bg-gray-1 inline-flex size-[30px] items-center justify-center rounded-sm transition-colors"
      >
        <IconDots aria-hidden size={18} stroke={1.5} />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={4} align="end" className="z-50 outline-none">
          <BaseMenu.Popup className="border-gray-2 min-w-44 origin-(--transform-origin) rounded-md border bg-white p-1 shadow-md transition-[opacity,scale] duration-100 outline-none data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {actions.map(({ label, icon: Icon, tone, onSelect }) => (
              <BaseMenu.Item
                key={label}
                onClick={onSelect}
                className={`data-[highlighted]:bg-gray-1 flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none ${tone === 'danger' ? 'text-red-6' : ''}`}
              >
                <Icon aria-hidden size={16} stroke={1.5} />
                {label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
