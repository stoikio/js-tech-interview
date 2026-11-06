import { Select as BaseSelect } from '@base-ui/react/select';
import { IconCheck, IconSelector } from '@tabler/icons-react';

import { Field, inputClasses, useFieldIds } from './TextInput';

export type SelectOption<T> = { value: T; label: string };

type Props<T> = {
  id?: string;
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: T) => void;
};

/** Dropdown built on Base UI: keyboard navigation, typeahead and positioning included. */
export function Select<T extends string | number>(props: Props<T>) {
  const { id, label, options, value, placeholder = 'Select…', disabled, error, onChange } = props;
  const { id: fieldId, ...aria } = useFieldIds(id, error);

  return (
    <Field id={fieldId} label={label} error={error}>
      <BaseSelect.Root
        id={fieldId}
        items={options}
        value={value}
        disabled={disabled}
        onValueChange={(next) => next !== null && onChange(next as T)}
      >
        <BaseSelect.Trigger
          {...aria}
          className={`${inputClasses} data-[popup-open]:border-blue flex items-center justify-between gap-2 text-left`}
        >
          <BaseSelect.Value
            placeholder={placeholder}
            className="data-[placeholder]:text-gray truncate"
          />
          <BaseSelect.Icon className="text-gray-6 shrink-0">
            <IconSelector aria-hidden size={16} stroke={1.5} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            sideOffset={4}
            alignItemWithTrigger={false}
            className="z-50 outline-none"
          >
            <BaseSelect.Popup className="border-gray-2 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-md border bg-white p-1 shadow-md transition-[opacity,scale] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className="data-[highlighted]:bg-gray-1 flex cursor-default items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[selected]:font-medium"
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="text-blue">
                      <IconCheck aria-hidden size={16} stroke={2} />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </Field>
  );
}
