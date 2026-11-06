import { TurnoverSelect } from '../../components/TurnoverSelect';
import { formatCompactMoney, OPTION_LABELS } from '../../lib/format';
import type { PricingCatalog, CoverageOption, QuoteConfiguration } from '../../lib/types';
import { Card } from '../../ui/Card';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Switch } from '../../ui/Switch';

type Props = {
  catalog: PricingCatalog;
  configuration: QuoteConfiguration;
  onChange: (changes: Partial<QuoteConfiguration>) => void;
};

/** Every change is saved and repriced by the API (see useLiveQuote). */
export function QuoteForm({ catalog, configuration, onChange }: Props) {
  function toggleOption(option: CoverageOption, selected: boolean) {
    const options = selected
      ? [...configuration.options, option]
      : configuration.options.filter((o) => o !== option);
    onChange({ options });
  }

  return (
    <Card title="Quote">
      <div className="divide-gray-2 divide-y [&>*]:py-5 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
        <TurnoverSelect
          brackets={catalog.turnoverBrackets}
          valueCents={configuration.annualRevenueCents}
          onChange={(annualRevenueCents) => onChange({ annualRevenueCents })}
        />
        <div className="space-y-4">
          <SegmentedControl
            label="Coverage limit"
            values={catalog.coverageLimitsCents}
            selected={configuration.coverageLimitCents}
            format={formatCompactMoney}
            onSelect={(coverageLimitCents) => onChange({ coverageLimitCents })}
          />
          <SegmentedControl
            label="Deductible"
            values={catalog.deductiblesCents}
            selected={configuration.deductibleCents}
            format={formatCompactMoney}
            onSelect={(deductibleCents) => onChange({ deductibleCents })}
          />
        </div>
        <div>
          <fieldset>
            <legend className="text-gray-9 mb-1 text-sm font-medium">Options</legend>
            {catalog.options.map((option) => (
              <Switch
                key={option}
                label={OPTION_LABELS[option]}
                checked={configuration.options.includes(option)}
                onChange={(selected) => toggleOption(option, selected)}
              />
            ))}
          </fieldset>
        </div>
      </div>
    </Card>
  );
}
