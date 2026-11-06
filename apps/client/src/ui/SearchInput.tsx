import { IconSearch } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

import { inputClasses } from './TextInput';

type Props = { label: string; value: string; onChange: (value: string) => void };

/** Search field focused with the `/` key. */
export function SearchInput({ label, value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || target.closest('input, textarea, [contenteditable], [data-toolbox]'))
        return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener('keydown', focus);
    return () => document.removeEventListener('keydown', focus);
  }, []);

  return (
    <div className="relative w-full sm:w-64">
      <IconSearch
        aria-hidden
        size={16}
        stroke={1.5}
        className="text-gray absolute top-2.5 left-2.5"
      />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={`${label}…`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClasses} pr-8 pl-8`}
      />
      <kbd className="border-gray-2 bg-gray-0 text-gray-6 pointer-events-none absolute top-2 right-2 hidden h-5 items-center rounded-xs border px-1.5 text-xs sm:flex">
        /
      </kbd>
    </div>
  );
}
