import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Stub localStorage
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
});

// Suppress console.error noise from expected GraphQL errors in tests
const originalConsoleError = console.error;
vi.stubGlobal('console', {
  ...console,
  error: (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('[GraphQL]')) return;
    originalConsoleError(...args);
  },
});
