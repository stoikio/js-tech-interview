import type { ReactNode } from 'react';

export type Tone = 'gray' | 'blue' | 'green' | 'orange' | 'red' | 'cyan';

const tones: Record<Tone, string> = {
  gray: 'bg-gray-2/50 text-gray-8',
  blue: 'bg-blue-2/50 text-blue-8',
  green: 'bg-green-2/50 text-green-8',
  orange: 'bg-orange-2/50 text-orange-8',
  red: 'bg-red-2/50 text-red-8',
  cyan: 'bg-cyan-2/50 text-cyan-8',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-xl px-2.5 text-[11px] font-medium tracking-[0.25px] whitespace-nowrap uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
