import { IconBriefcase } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import { Page } from '../../layout/Page';
import { PageHeader } from '../../layout/PageHeader';
import { formatDate, formatMoney, formatTurnoverBracket, OPTION_LABELS } from '../../lib/format';
import { useContract, usePricingCatalog } from '../../lib/server-state';
import { findBracket } from '../../lib/turnover';
import type { ContractDetail, PricingCatalog } from '../../lib/types';
import { ErrorAlert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/Skeleton';

/** What a company signed, as a read-only record. The quote it came from is not shown. */
export function ContractPage() {
  const { contractId = '' } = useParams();
  const contract = useContract(contractId);
  const catalog = usePricingCatalog();

  return (
    <>
      <PageHeader
        icon={IconBriefcase}
        breadcrumbs={[
          { label: 'Contracts', to: '/contracts' },
          { label: contract.data?.company.name ?? 'Contract' },
        ]}
      />
      <Page width="narrow">
        <ErrorAlert error={contract.error ?? catalog.error} />
        {contract.isPending && <ContractSkeleton />}
        {contract.data && (
          <ContractRecord contract={contract.data} brackets={catalog.data?.turnoverBrackets} />
        )}
      </Page>
    </>
  );
}

type RecordProps = {
  contract: ContractDetail;
  brackets: PricingCatalog['turnoverBrackets'] | undefined;
};

function ContractRecord({ contract, brackets }: RecordProps) {
  const { company } = contract;
  const bracket = brackets && findBracket(brackets, company.annualRevenueCents);

  return (
    <>
      <h1 className="text-[22px] leading-[1.4] font-medium">{company.name}</h1>
      <p className="text-gray-7 mt-1">Signed on {formatDate(contract.startDate)}</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <Figure label="Annual premium" value={formatMoney(contract.premiumCents)} />
        <Figure label="Start" value={formatDate(contract.startDate)} />
        <Figure label="End" value={formatDate(contract.endDate)} />
      </dl>

      <Section title="Coverage">
        <Row label="Coverage limit">{formatMoney(contract.coverageLimitCents)}</Row>
        <Row label="Deductible">{formatMoney(contract.deductibleCents)}</Row>
        <Row label="Options">
          {contract.options.length === 0 ? (
            <span className="text-gray-6">No options</span>
          ) : (
            <span className="flex flex-wrap justify-end gap-1.5">
              {contract.options.map((option) => (
                <Badge key={option} tone="blue">
                  {OPTION_LABELS[option]}
                </Badge>
              ))}
            </span>
          )}
        </Row>
      </Section>

      <Section title="Company">
        <Row label="Name">{company.name}</Row>
        <Row label="Turnover">
          {bracket ? formatTurnoverBracket(bracket) : formatMoney(company.annualRevenueCents)}
        </Row>
      </Section>
    </>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-0 rounded-md px-4 py-3">
      <dt className="text-gray-7 text-xs">{label}</dt>
      <dd className="mt-0.5 text-lg font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-base font-medium">{title}</h2>
      <dl className="border-gray-2 divide-gray-2 divide-y border-y">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <dt className="text-gray-7">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function ContractSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-6 h-4 w-40" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-[62px] rounded-md" />
        <Skeleton className="h-[62px] rounded-md" />
        <Skeleton className="h-[62px] rounded-md" />
      </div>
      <Skeleton className="mt-8 mb-2 h-5 w-24" />
      <Skeleton className="h-[137px] rounded-md" />
    </div>
  );
}
