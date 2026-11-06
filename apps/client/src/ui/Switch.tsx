type Props = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

/** The whole row toggles the switch. */
export function Switch({ label, checked, disabled, onChange }: Props) {
  return (
    <label
      className={`-mx-2 flex items-center justify-between gap-4 rounded-sm px-2 py-2 ${disabled ? '' : 'hover:bg-gray-0 cursor-pointer'}`}
    >
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-[38px] shrink-0 rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-blue bg-blue' : 'border-gray-3 bg-gray-2'}`}
      >
        <span
          className={`absolute top-0.5 left-0 size-3.5 rounded-full bg-white shadow-xs transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}
