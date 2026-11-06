import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

/** 16px on touch screens so iOS does not zoom in, 14px elsewhere. */
export const inputClasses =
  'block h-9 w-full rounded-sm border border-gray-2 bg-white px-3 text-base text-black transition-colors placeholder:text-gray hover:border-gray-3 focus:border-blue focus:outline-none focus-visible:outline-none disabled:bg-gray-1 disabled:text-gray-6 aria-invalid:border-red sm:text-sm';

type FieldProps = {
  id: string;
  label: string;
  description?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

/** Label, control, then the description or the error. */
export function Field({ id, label, description, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-gray-9 mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-help`} className="text-red-6 mt-1 text-xs leading-[1.2]" aria-live="polite">
          {error}
        </p>
      ) : (
        description && (
          <p id={`${id}-help`} className="text-gray-6 mt-1 text-xs leading-[1.2]">
            {description}
          </p>
        )
      )}
    </div>
  );
}

/** Props shared by the inputs built on Field. */
export function useFieldIds(
  id: string | undefined,
  error?: string | null,
  description?: ReactNode,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return {
    id: inputId,
    'aria-invalid': Boolean(error),
    'aria-describedby': error || description ? `${inputId}-help` : undefined,
  };
}

type Props = InputHTMLAttributes<HTMLInputElement> & Omit<FieldProps, 'children' | 'id'>;

export function TextInput({ id, label, description, error, ...props }: Props) {
  const ids = useFieldIds(id, error, description);
  return (
    <Field id={ids.id} label={label} description={description} error={error}>
      <input className={inputClasses} {...ids} {...props} />
    </Field>
  );
}
