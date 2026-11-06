import type { ButtonHTMLAttributes } from 'react';

import { Tooltip } from './Tooltip';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean };

/** Square button with an icon only. Its label is the accessible name and the tooltip. */
export function IconButton({ label, pressed, className = '', ...props }: Props) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        className={`text-gray-7 hover:bg-gray-1 aria-pressed:bg-gray-2 inline-flex size-8 shrink-0 items-center justify-center rounded-sm transition-colors hover:text-black disabled:opacity-40 aria-pressed:text-black ${className}`}
        {...props}
      />
    </Tooltip>
  );
}
