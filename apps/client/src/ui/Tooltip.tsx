import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactElement } from 'react';

type Props = { content: string | null | undefined; children: ReactElement };

/**
 * Explains an element on hover and keyboard focus, with no delay.
 * Screen readers get the same text as the element's description.
 * Without content, renders the element alone.
 */
export function Tooltip({ content, children }: Props) {
  if (!content) return children;
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={0} render={children} aria-description={content} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6} className="z-50">
          <BaseTooltip.Popup className="bg-gray-9 max-w-64 origin-(--transform-origin) rounded-sm px-2.5 py-1.5 text-xs text-white shadow-md transition-[opacity,scale] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
