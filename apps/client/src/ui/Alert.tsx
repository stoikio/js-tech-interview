import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';
import type { ReactNode } from 'react';

type Tone = 'blue' | 'green' | 'orange' | 'red';

const tones: Record<Tone, string> = {
  blue: 'border-blue-2 bg-blue-0 text-blue-8',
  green: 'border-green-2 bg-green-0 text-green-8',
  orange: 'border-orange-2 bg-orange-0 text-orange-8',
  red: 'border-red-2 bg-red-0 text-red-8',
};

const icons = {
  blue: IconInfoCircle,
  green: IconCircleCheck,
  orange: IconAlertTriangle,
  red: IconAlertTriangle,
};

export function Alert({ tone = 'blue', children }: { tone?: Tone; children: ReactNode }) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === 'red' ? 'alert' : 'status'}
      className={`flex gap-2 rounded-md border p-3 text-sm ${tones[tone]}`}
    >
      <Icon size={20} stroke={1.5} className="shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Shows the message of an error, or nothing. */
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <Alert tone="red">{error instanceof Error ? error.message : 'Something went wrong'}</Alert>
  );
}
