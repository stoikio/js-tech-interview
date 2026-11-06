import { useNavigate } from 'react-router';

import { formatCompactMoney, formatMoney, OPTION_LABELS } from '../../lib/format';
import { useValidateQuote } from '../../lib/server-state';
import type { Quote } from '../../lib/types';
import { ErrorAlert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { ConfirmedAction } from '../../ui/ConfirmedAction';
import { Loader } from '../../ui/Loader';
import { useToast } from '../../ui/Toast';
import { Tooltip } from '../../ui/Tooltip';
import type { QuoteSession } from './useLiveQuote';

type Props = { quote: Quote; session: QuoteSession };

/** The premium computed by the API, line by line, and the validation of the quote. */
export function QuoteSummary({ quote, session }: Props) {
  const breakdown = quote.pricingBreakdown;
  const { isUpdating, error, blockedReason } = session;
  const stale = isUpdating || error;

  return (
    <aside aria-label="Premium" className="border-gray-2 rounded-md border bg-white shadow-md">
      <div className="px-5 py-4">
        <div className="text-gray-7 flex items-center justify-between">
          <span>Annual premium</span>
          {isUpdating && <Loader className="size-4" />}
        </div>
        <p
          aria-live="polite"
          className={`mt-1 text-[34px] leading-[1.2] font-medium tabular-nums transition-opacity ${stale ? 'opacity-40' : ''}`}
        >
          {formatMoney(quote.premiumCents)}
        </p>
      </div>

      <dl
        className={`border-gray-2 space-y-2 border-t px-5 py-4 transition-opacity ${stale ? 'opacity-40' : ''}`}
      >
        <Line
          label="Base cover"
          detail={`${formatCompactMoney(breakdown.coverageLimitCents)} limit, ${formatCompactMoney(breakdown.deductibleCents)} deductible`}
          value={formatMoney(breakdown.coveragePremiumCents)}
        />
        {breakdown.optionLoadings.map(({ option, premiumCents }) => (
          <Line key={option} label={OPTION_LABELS[option]} value={formatMoney(premiumCents)} />
        ))}
      </dl>

      <div className="border-gray-2 space-y-3 border-t px-5 py-4">
        <ErrorAlert error={error} />
        <Validation quote={quote} blockedReason={blockedReason} />
      </div>
    </aside>
  );
}

function Validation({ quote, blockedReason }: { quote: Quote; blockedReason: string | null }) {
  const validate = useValidateQuote();
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <ConfirmedAction
      trigger={(ask) => (
        <Tooltip content={blockedReason}>
          <Button
            className="w-full"
            aria-disabled={blockedReason !== null}
            onClick={() => blockedReason === null && ask()}
          >
            Validate quote
          </Button>
        </Tooltip>
      )}
      title="Validate this quote?"
      confirmLabel="Validate quote"
      onConfirm={() => validate.mutateAsync(quote.id)}
      onSuccess={(contract) => {
        toast('Quote signed');
        navigate(`/contracts/${contract.id}`, { replace: true });
      }}
    >
      <p className="text-gray-7 mt-2">
        The contract starts today for 12 months, at {formatMoney(quote.premiumCents)} per year. The
        quote can no longer be changed.
      </p>
    </ConfirmedAction>
  );
}

function Line({ label, detail, value }: { label: string; detail?: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>
        {label}
        {detail && <span className="text-gray-6 block text-xs">{detail}</span>}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
