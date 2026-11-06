import { defineConfig, type OxlintOverride } from 'oxlint';

const BOUNDED_CONTEXTS = ['pricing', 'distribution'] as const;
type BoundedContext = (typeof BOUNDED_CONTEXTS)[number];

const restrictImports = (...patterns: { group: string[]; message: string }[]) => ({
  'no-restricted-imports': ['error', { patterns }],
});

/**
 * A context owns its model: domain/ is framework-free, use cases depend on
 * ports only, and no context reaches into another except through an
 * `.in-process` adapter calling the other context's public-api.ts.
 *
 * One override per file, never two: oxlint replaces a rule's config when a
 * later override matches the same file, so overlapping globs would cancel each other.
 */
const boundedContextOverrides = (context: BoundedContext): OxlintOverride[] => {
  const peers = BOUNDED_CONTEXTS.filter((other) => other !== context);
  const noPeers = {
    group: peers.map((peer) => `src/${peer}/**`),
    message: `${context}/ must not import another bounded context. Define a port in ${context}/domain/ports/ and implement it with an .in-process adapter.`,
  };

  const root = `apps/api/src/${context}`;
  const domain = `${root}/domain/**/*.ts`;
  const useCase = `${root}/use-cases/**/use-case.ts`;
  const controller = `${root}/use-cases/**/controller.*.ts`;
  // The only files allowed to import another context, through its public-api.ts.
  const crossContext = [`${root}/infra/adapters/*.in-process.ts`, `${root}/${context}.module.ts`];

  return [
    {
      files: [domain],
      rules: restrictImports({
        group: [
          '@nestjs/*',
          '@prisma/*',
          'src/common/**',
          'src/generated/**',
          'src/core/infra/**',
          `src/${context}/infra/**`,
          `src/${context}/use-cases/**`,
          ...noPeers.group,
        ],
        message: `${context}/domain/ is the model: it imports src/core/domain/ and pure libraries only.`,
      }),
    },
    {
      files: [useCase],
      rules: restrictImports(noPeers, {
        group: ['src/common/**', 'src/generated/**', '@prisma/*', `src/${context}/infra/**`],
        message: `A use case depends on ports from ${context}/domain/ports/, never on an adapter or on Prisma. ${context}.module.ts binds the adapters.`,
      }),
    },
    {
      files: [controller],
      rules: restrictImports(noPeers, {
        group: [`src/${context}/infra/adapters/**`],
        message: `A controller calls a use case or a port, never an adapter.`,
      }),
    },
    {
      files: crossContext,
      rules: restrictImports({
        group: [...noPeers.group, ...peers.map((peer) => `!src/${peer}/public-api`)],
        message: `Only .in-process adapters and the module may use another context, through its public-api.ts.`,
      }),
    },
    {
      files: [`${root}/**/*.ts`],
      excludeFiles: [domain, useCase, controller, ...crossContext],
      rules: restrictImports(noPeers),
    },
  ];
};

export default defineConfig({
  plugins: ['typescript', 'import', 'react'],
  env: { node: true, browser: true },
  ignorePatterns: ['**/dist', '**/coverage', '**/generated'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'object-shorthand': ['error', 'properties'],
    'typescript/array-type': ['error', { default: 'array' }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'error',
  },
  overrides: [
    {
      files: ['apps/api/src/core/domain/**/*.ts'],
      rules: restrictImports({
        group: [
          '@nestjs/*',
          '@prisma/*',
          'src/common/**',
          'src/generated/**',
          'src/core/infra/**',
          ...BOUNDED_CONTEXTS.map((context) => `src/${context}/**`),
        ],
        message: 'core/domain/ is the shared kernel: pure TypeScript, no framework, no context.',
      }),
    },
    ...BOUNDED_CONTEXTS.flatMap(boundedContextOverrides),
    {
      // Scripts print to the terminal.
      files: ['apps/api/prisma/**', 'apps/client/scripts/**', 'scripts/**'],
      rules: { 'no-console': 'off' },
    },
  ],
});
