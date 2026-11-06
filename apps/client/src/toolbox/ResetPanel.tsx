import { Button } from '../ui/Button';
import { ConfirmedAction } from '../ui/ConfirmedAction';
import { useToast } from '../ui/Toast';
import { clearAll } from './storage';

/** Starts the exercise over in this browser, before a rehearsal or another candidate. */
export function ResetPanel() {
  const toast = useToast();

  return (
    <div className="space-y-4 p-4">
      <p className="text-gray-7">
        Deletes what the toolbox keeps in this browser: the notes, the diagram and the data model
        layout. To reset the data of the app too, run <code>pnpm db:reset</code>.
      </p>
      <ConfirmedAction
        trigger={(ask) => (
          <Button variant="danger" className="w-full" onClick={ask}>
            Clear the toolbox
          </Button>
        )}
        title="Clear the toolbox?"
        confirmLabel="Clear the toolbox"
        variant="danger"
        onConfirm={clearAll}
        onSuccess={() => toast('Toolbox cleared')}
      >
        <p className="text-gray-7 mt-2">The notes and the diagram cannot be recovered.</p>
      </ConfirmedAction>
    </div>
  );
}
