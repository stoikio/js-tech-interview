import { IconAddressBook } from '@tabler/icons-react';
import { Navigate, useParams } from 'react-router';

import { Page } from '../../layout/Page';
import { PageHeader } from '../../layout/PageHeader';
import { usePricingCatalog, useProspect } from '../../lib/server-state';
import type { Company, PricingCatalog, Quote } from '../../lib/types';
import { Alert, ErrorAlert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/Skeleton';
import { ProspectActions } from './ProspectActions';
import { QuoteForm } from './QuoteForm';
import { QuoteSummary } from './QuoteSummary';
import { useLiveQuote } from './useLiveQuote';

export function ProspectPage() {
  const { companyId = '' } = useParams();
  const prospect = useProspect(companyId);
  const catalog = usePricingCatalog();

  const company = prospect.data?.company;
  const quote = prospect.data?.quote;
  // The API signs a quote and creates its contract in one transaction, so a signed quote always
  // has its contract and is shown on its own page. A quote shown here is a draft quote.
  if (quote?.contract) return <Navigate to={`/contracts/${quote.contract.id}`} replace />;

  return (
    <>
      <PageHeader
        icon={IconAddressBook}
        breadcrumbs={[
          { label: 'Prospects', to: '/prospects' },
          { label: company?.name ?? 'Prospect' },
        ]}
        status={quote && <Badge tone="blue">Draft</Badge>}
      >
        {company && quote && <ProspectActions company={company} />}
      </PageHeader>
      <Page width="wide">
        <ErrorAlert error={prospect.error ?? catalog.error} />
        {(prospect.isPending || catalog.isPending) && <ProspectSkeleton />}
        {company && prospect.data && (
          <h1 className="mb-6 text-[22px] leading-[1.4] font-medium">{company.name}</h1>
        )}
        {prospect.data && catalog.data && !quote && (
          <Alert tone="orange">This company has no quote.</Alert>
        )}
        {company && catalog.data && quote && (
          // Remount when the quote changes so the form starts from the saved configuration.
          <QuoteWorkspace key={quote.id} company={company} quote={quote} catalog={catalog.data} />
        )}
      </Page>
    </>
  );
}

type WorkspaceProps = { company: Company; quote: Quote; catalog: PricingCatalog };

function QuoteWorkspace({ company, quote, catalog }: WorkspaceProps) {
  const session = useLiveQuote(company, quote);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <QuoteForm
        catalog={catalog}
        configuration={session.configuration}
        onChange={session.update}
      />
      <div className="lg:sticky lg:top-[66px]">
        <QuoteSummary quote={quote} session={session} />
      </div>
    </div>
  );
}

function ProspectSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-7 w-64" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[420px] rounded-md" />
        <Skeleton className="h-[420px] rounded-md" />
      </div>
    </div>
  );
}
