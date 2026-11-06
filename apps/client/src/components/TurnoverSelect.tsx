import { formatTurnoverBracket } from '../lib/format';
import { findBracket } from '../lib/turnover';
import type { PricingCatalog } from '../lib/types';
import { Select } from '../ui/Select';

type Props = {
  id?: string;
  brackets: PricingCatalog['turnoverBrackets'];
  valueCents: number;
  error?: string | null;
  onChange: (cents: number) => void;
};

/**
 * Turnover picked from brackets, which match the revenue bands of the pricing rules.
 * A bracket is saved as its upper bound: prices only depend on the band.
 */
export function TurnoverSelect({ id, brackets, valueCents, error, onChange }: Props) {
  const selected = findBracket(brackets, valueCents);
  return (
    <Select
      id={id}
      label="Turnover"
      placeholder="Select a bracket"
      options={brackets.map((bracket) => ({
        value: bracket.maxCents,
        label: formatTurnoverBracket(bracket),
      }))}
      value={selected?.maxCents ?? null}
      error={error}
      onChange={onChange}
    />
  );
}
