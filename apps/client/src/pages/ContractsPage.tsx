import { IconBriefcase } from '@tabler/icons-react';

import { Page } from '../layout/Page';
import { PageHeader } from '../layout/PageHeader';
import { formatDate, formatMoney } from '../lib/format';
import { useContracts } from '../lib/server-state';
import { useListFilters } from '../lib/use-list-filters';
import { ErrorAlert } from '../ui/Alert';
import { EmptyState } from '../ui/EmptyState';
import { SearchInput } from '../ui/SearchInput';
import { TableSkeleton } from '../ui/Skeleton';
import { RowLink, Table, Td, Th, Tr } from '../ui/Table';

/** Signed quotes, newest first. */
export function ContractsPage() {
  const contracts = useContracts();
  const { search, setSearch, matches } = useListFilters();

  const visible = contracts.data?.filter((c) => matches(c.company.name)) ?? [];

  return (
    <>
      <PageHeader icon={IconBriefcase} breadcrumbs={[{ label: 'Contracts' }]} />
      <Page>
        <div className="mb-4 flex justify-end">
          <SearchInput label="Search contracts" value={search} onChange={setSearch} />
        </div>
        <ErrorAlert error={contracts.error} />
        {contracts.isPending && <TableSkeleton columns={4} />}
        {contracts.data && visible.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th align="right">Premium per year</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((contract) => (
                <Tr key={contract.id}>
                  <Td>
                    <RowLink to={`/contracts/${contract.id}`}>{contract.company.name}</RowLink>
                  </Td>
                  <Td>
                    <span className="whitespace-nowrap">{formatDate(contract.startDate)}</span>
                  </Td>
                  <Td>
                    <span className="whitespace-nowrap">{formatDate(contract.endDate)}</span>
                  </Td>
                  <Td align="right">{formatMoney(contract.premiumCents)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {contracts.data && visible.length === 0 && (
          <EmptyState icon={IconBriefcase}>
            {contracts.data.length === 0 ? 'No contracts yet.' : 'No contract matches your search.'}
          </EmptyState>
        )}
      </Page>
    </>
  );
}
