/** Optional coverage extensions a quote can include. */
export const COVERAGE_OPTIONS = [
  'ransomware_extortion',
  'social_engineering_fraud',
  'business_interruption',
  'regulatory_fines',
] as const;

export type CoverageOption = (typeof COVERAGE_OPTIONS)[number];
