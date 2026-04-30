// ============================================================
// ENVIRONMENT — Staging
// ============================================================

import type { Environment } from './environment.types';

export const environment: Environment = {
  name: 'staging',
  production: false,
  apiUrl: 'https://api.stg.acme.com/api',
  wsUrl: 'wss://api.stg.acme.com',
  authDomain: 'auth.stg.acme.com',
  logLevel: 'warn',
  featureFlags: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enableDevTools: false,
    enableMockData: false,
  },
};
