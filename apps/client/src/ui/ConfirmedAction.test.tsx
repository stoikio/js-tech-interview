import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmedAction } from './ConfirmedAction';

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(onConfirm: () => Promise<string>, onSuccess = vi.fn()) {
  render(
    <ConfirmedAction
      trigger={(ask) => <button onClick={ask}>Delete prospect</button>}
      title="Delete this prospect?"
      confirmLabel="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onSuccess={onSuccess}
    >
      <p>This cannot be undone.</p>
    </ConfirmedAction>,
  );
  return { user: userEvent.setup(), onSuccess };
}

const dialog = () => screen.queryByRole('dialog');
// While loading, the spinner adds its own name to the button's.
const confirmButton = () => screen.getByRole('button', { name: /^(Loading)?Delete$/ });

describe('ConfirmedAction', () => {
  it('asks before doing anything', async () => {
    const onConfirm = vi.fn(async () => 'done');
    const { user } = setup(onConfirm);
    expect(dialog()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));

    expect(screen.getByRole('dialog', { name: 'Delete this prospect?' })).toBeDefined();
    expect(screen.getByText('This cannot be undone.')).toBeDefined();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does nothing when the broker cancels', async () => {
    const onConfirm = vi.fn(async () => 'done');
    const { user, onSuccess } = setup(onConfirm);

    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(dialog()).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows the button loading while the action runs, then closes and reports the result', async () => {
    const running = deferred<string>();
    const { user, onSuccess } = setup(() => running.promise);

    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));
    await user.click(confirmButton());

    expect(confirmButton().getAttribute('aria-busy')).toBe('true');
    expect((confirmButton() as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(onSuccess).not.toHaveBeenCalled();

    running.resolve('deleted');

    await waitFor(() => expect(dialog()).toBeNull());
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith('deleted');
  });

  it('keeps the dialog open and shows why when the action fails, so it can be retried', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const attempts = [first, second];
    let attempt = 0;
    const { user, onSuccess } = setup(
      () => attempts[attempt++]?.promise ?? Promise.reject(new Error('x')),
    );

    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));
    await user.click(confirmButton());
    first.reject(new Error('The prospect was already deleted'));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The prospect was already deleted',
    );
    expect(dialog()).not.toBeNull();
    expect(confirmButton().getAttribute('aria-busy')).not.toBe('true');
    expect(onSuccess).not.toHaveBeenCalled();

    await user.click(confirmButton());
    expect(screen.queryByRole('alert')).toBeNull();
    second.resolve('deleted');

    await waitFor(() => expect(onSuccess).toHaveBeenCalledExactlyOnceWith('deleted'));
  });

  it('does not show the error of an abandoned attempt when it is opened again', async () => {
    const { user } = setup(() => Promise.reject(new Error('Not now')));

    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));
    await user.click(confirmButton());
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog()).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Delete prospect' }));

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
