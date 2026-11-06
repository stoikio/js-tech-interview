import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Testing Library only cleans up by itself when the runner exposes globals.
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
