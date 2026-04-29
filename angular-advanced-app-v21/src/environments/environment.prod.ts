// ============================================================
// ENVIRONMENT — Production
// ============================================================

import { Environment } from './environment';

export const environment: Environment = {
  name: 'production',
  production: true,
  apiUrl: 'https://api.acme.com/api',
  wsUrl: 'wss://api.acme.com',
  authDomain: 'auth.acme.com',
  logLevel: 'error',
  featureFlags: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enableDevTools: false,
    enableMockData: false,
  },
};
