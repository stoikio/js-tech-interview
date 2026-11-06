import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { TurnoverSelect } from '../components/TurnoverSelect';
import { ApiError } from '../lib/api';
import { usePricingCatalog, useCreateProspect } from '../lib/server-state';
import { NO_TURNOVER_CENTS, turnoverError } from '../lib/turnover';
import { ErrorAlert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { TextInput } from '../ui/TextInput';
import { useToast } from '../ui/Toast';

type Values = { name: string; annualRevenueCents: number };
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const FIELDS: FieldName[] = ['name', 'annualRevenueCents'];
const fieldId = (field: FieldName) => `prospect-${field}`;
const EMPTY: Values = { name: '', annualRevenueCents: NO_TURNOVER_CENTS };

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Enter the company name.';
  const turnover = turnoverError(values.annualRevenueCents);
  if (turnover) errors.annualRevenueCents = turnover;
  return errors;
}

/** Validation messages come as `field: message`; pricing refusals concern the turnover. */
function errorsFromApi(error: unknown): Errors {
  if (!(error instanceof ApiError)) return {};
  if (error.code?.startsWith('pricing.')) return { annualRevenueCents: error.message };
  const errors: Errors = {};
  for (const message of error.messages) {
    const [field, ...rest] = message.split(': ');
    if (FIELDS.includes(field as FieldName)) errors[field as FieldName] = rest.join(': ');
  }
  return errors;
}

const focusField = (errors: Errors) => {
  const first = FIELDS.find((field) => errors[field]);
  if (first) document.getElementById(fieldId(first))?.focus();
};

export function NewProspectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Set<FieldName>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const catalog = usePricingCatalog();
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateProspect();

  function close() {
    setValues(EMPTY);
    setTouched(new Set());
    setSubmitted(false);
    create.reset();
    onClose();
  }

  const clientErrors = validate(values);
  const apiErrors = errorsFromApi(create.error);
  const errorOf = (field: FieldName) =>
    (submitted || touched.has(field) ? clientErrors[field] : undefined) ?? apiErrors[field];
  const unmappedError = create.error && Object.keys(apiErrors).length === 0 ? create.error : null;

  const change = (patch: Partial<Values>) => {
    setValues((current) => ({ ...current, ...patch }));
    create.reset();
  };
  // Errors show once a field was filled then left, or on submit: never for a field just skipped.
  const blur = (field: FieldName) => setTouched((current) => new Set(current).add(field));

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(clientErrors).length > 0) return focusField(clientErrors);
    create.mutate(
      { ...values, name: values.name.trim() },
      {
        onSuccess: ({ id }) => {
          toast('Prospect created');
          close();
          navigate(`/prospects/${id}`);
        },
        onError: (error) => focusField(errorsFromApi(error)),
      },
    );
  }

  return (
    <Dialog open={open} title="New prospect" onClose={close}>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <TextInput
          id={fieldId('name')}
          label="Company name"
          name="organization"
          autoComplete="organization"
          autoFocus
          value={values.name}
          error={errorOf('name')}
          onChange={(e) => change({ name: e.target.value })}
          onBlur={() => values.name && blur('name')}
        />
        <TurnoverSelect
          id={fieldId('annualRevenueCents')}
          brackets={catalog.data?.turnoverBrackets ?? []}
          valueCents={values.annualRevenueCents}
          error={errorOf('annualRevenueCents')}
          onChange={(annualRevenueCents) => {
            change({ annualRevenueCents });
            blur('annualRevenueCents');
          }}
        />
        <ErrorAlert error={catalog.error} />
        <ErrorAlert error={unmappedError} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create prospect
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
