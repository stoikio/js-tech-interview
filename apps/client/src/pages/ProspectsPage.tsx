import { IconAddressBook, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

import { Page } from '../layout/Page';
import { PageHeader } from '../layout/PageHeader';
import { formatCompactMoney, formatMoney, OPTION_LABELS } from '../lib/format';
import { useProspects } from '../lib/server-state';
import type { CoverageOption } from '../lib/types';
import { useListFilters } from '../lib/use-list-filters';
import { ErrorAlert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SearchInput } from '../ui/SearchInput';
import { TableSkeleton } from '../ui/Skeleton';
import { RowLink, Table, Td, Th, Tr } from '../ui/Table';
import { Tooltip } from '../ui/Tooltip';
import { NewProspectDialog } from './NewProspectDialog';

/** Companies with a quote that is not signed yet. */
export function ProspectsPage() {
  const prospects = useProspects();
  const { search, setSearch, matches } = useListFilters();
  const [creating, setCreating] = useState(false);

  const visible = prospects.data?.filter((p) => matches(p.name)) ?? [];
  const newProspectButton = (
    <Button size="xs" onClick={() => setCreating(true)}>
      <IconPlus aria-hidden size={16} stroke={1.5} />
      New prospect
    </Button>
  );

  return (
    <>
      <PageHeader icon={IconAddressBook} breadcrumbs={[{ label: 'Prospects' }]}>
        {newProspectButton}
      </PageHeader>
      <Page>
        <div className="mb-4 flex justify-end">
          <SearchInput label="Search prospects" value={search} onChange={setSearch} />
        </div>
        <ErrorAlert error={prospects.error} />
        {prospects.isPending && <TableSkeleton columns={5} />}
        {prospects.data && visible.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th align="right">Limit</Th>
                <Th align="right">Deductible</Th>
                <Th>Options</Th>
                <Th align="right">Premium per year</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((prospect) => (
                <Tr key={prospect.id}>
                  <Td>
                    <RowLink to={`/prospects/${prospect.id}`}>{prospect.name}</RowLink>
                  </Td>
                  <Td align="right">
                    {formatCompactMoney(prospect.latestQuote.coverageLimitCents)}
                  </Td>
                  <Td align="right">{formatCompactMoney(prospect.latestQuote.deductibleCents)}</Td>
                  <Td>
                    <OptionsCount options={prospect.latestQuote.options} />
                  </Td>
                  <Td align="right">{formatMoney(prospect.latestQuote.premiumCents)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {prospects.data && visible.length === 0 && (
          <EmptyState icon={IconAddressBook}>
            {prospects.data.length === 0 ? (
              <>
                <p>No prospects yet.</p>
                <div className="mt-3">{newProspectButton}</div>
              </>
            ) : (
              'No prospect matches your search.'
            )}
          </EmptyState>
        )}
      </Page>
      <NewProspectDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

/** "2 options", with their names in a tooltip. Above the row link, so the tooltip can be reached. */
function OptionsCount({ options }: { options: CoverageOption[] }) {
  if (options.length === 0) return <span className="text-gray-6">No options</span>;
  return (
    <Tooltip content={options.map((option) => OPTION_LABELS[option]).join(', ')}>
      <span tabIndex={0} className="relative cursor-default underline decoration-dotted">
        {options.length} {options.length === 1 ? 'option' : 'options'}
      </span>
    </Tooltip>
  );
}
