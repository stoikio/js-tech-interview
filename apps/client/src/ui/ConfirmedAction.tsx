import { useState, type ReactNode } from 'react';

import { ErrorAlert } from './Alert';
import { Button } from './Button';
import { Dialog } from './Dialog';

type Props<T> = {
  /** What opens the dialog: a button, a menu item. */
  trigger: (ask: () => void) => ReactNode;
  title: string;
  /** What the broker is about to do, and what cannot be undone. */
  children: ReactNode;
  confirmLabel: string;
  variant?: 'filled' | 'danger';
  /** Runs when the broker confirms. A rejection is shown in the dialog, which stays open. */
  onConfirm: () => Promise<T> | T;
  /** Runs once the dialog is closed after a success: the toast and the navigation. */
  onSuccess?: (result: T) => void;
};

/**
 * An action that cannot be undone, behind a confirmation dialog. It owns what is the same for
 * every such action: the dialog, the loading button and the error of a failed attempt.
 */
export function ConfirmedAction<T>(props: Props<T>) {
  const {
    trigger,
    title,
    children,
    confirmLabel,
    variant = 'filled',
    onConfirm,
    onSuccess,
  } = props;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function confirm() {
    setPending(true);
    setError(null);
    let result: T;
    try {
      result = await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Something went wrong'));
      setPending(false);
      return;
    }
    setPending(false);
    close();
    onSuccess?.(result);
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      {/* The attempt cannot be abandoned half way: its outcome would arrive in a closed dialog. */}
      <Dialog open={open} title={title} onClose={() => !pending && close()}>
        {children}
        {error && (
          <div className="mt-3">
            <ErrorAlert error={error} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="default" disabled={pending} onClick={close}>
            Cancel
          </Button>
          <Button variant={variant} loading={pending} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
