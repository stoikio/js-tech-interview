type Props<T> = {
  label: string;
  values: T[];
  selected: T;
  disabled?: boolean;
  format: (value: T) => string;
  onSelect: (value: T) => void;
};

export function SegmentedControl<T extends string | number>(props: Props<T>) {
  const { label, values, selected, disabled, format, onSelect } = props;
  return (
    <div>
      <p className="text-gray-9 mb-1 text-sm font-medium">{label}</p>
      <div className="bg-gray-1 flex gap-1 rounded-sm p-1" role="radiogroup" aria-label={label}>
        {values.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === selected}
            disabled={disabled}
            onClick={() => onSelect(value)}
            className={`h-7 flex-1 rounded-sm text-sm transition-colors disabled:cursor-not-allowed ${
              value === selected
                ? 'bg-white font-medium text-black shadow-xs'
                : 'text-gray-7 disabled:hover:text-gray-7 hover:text-black'
            }`}
          >
            {format(value)}
          </button>
        ))}
      </div>
    </div>
  );
}
