import { IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

import { useDeleteProspect } from '../../lib/server-state';
import type { Company } from '../../lib/types';
import { ActionsMenu } from '../../ui/ActionsMenu';
import { ConfirmedAction } from '../../ui/ConfirmedAction';
import { useToast } from '../../ui/Toast';

/** More actions on a prospect: delete it, after confirmation. */
export function ProspectActions({ company }: { company: Company }) {
  const remove = useDeleteProspect();
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <ConfirmedAction
      trigger={(ask) => (
        <ActionsMenu
          actions={[{ label: 'Delete prospect', icon: IconTrash, tone: 'danger', onSelect: ask }]}
        />
      )}
      title="Delete this prospect?"
      confirmLabel="Delete prospect"
      variant="danger"
      onConfirm={() => remove.mutateAsync(company.id)}
      onSuccess={() => {
        toast('Prospect deleted');
        navigate('/prospects', { replace: true });
      }}
    >
      <p className="text-gray-7 mt-2">
        {company.name} and its quote will be deleted. This cannot be undone.
      </p>
    </ConfirmedAction>
  );
}
