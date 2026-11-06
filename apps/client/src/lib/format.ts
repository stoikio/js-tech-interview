import type { CoverageOption } from './types';

export const OPTION_LABELS: Record<CoverageOption, string> = {
  ransomware_extortion: 'Ransomware extortion',
  social_engineering_fraud: 'Social engineering fraud',
  business_interruption: 'Business interruption',
  regulatory_fines: 'Regulatory fines & penalties',
};

const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const compactMoney = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 123456 -> "€1,234.56" */
export const formatMoney = (cents: number) => money.format(cents / 100);

/** 50000000 -> "€500K" */
export const formatCompactMoney = (cents: number) => compactMoney.format(cents / 100);

/** Dates are shown in UTC: contract dates are calendar dates stored at midnight UTC. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** `{ 0, 1M EUR }` -> "Up to €1m", `{ 1M, 5M EUR }` -> "€1m to €5m" */
export const formatTurnoverBracket = ({
  minCents,
  maxCents,
}: {
  minCents: number;
  maxCents: number;
}) =>
  minCents === 0
    ? `Up to ${formatCompactMoney(maxCents)}`
    : `${formatCompactMoney(minCents)} to ${formatCompactMoney(maxCents)}`;
