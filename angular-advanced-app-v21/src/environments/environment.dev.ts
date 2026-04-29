// ============================================================
// ENVIRONMENT — Dev (remote development server)
// ============================================================

import { Environment } from './environment';

export const environment: Environment = {
  name: 'dev',
  production: false,
  apiUrl: 'https://api.dev.acme.com/api',
  wsUrl: 'wss://api.dev.acme.com',
  authDomain: 'auth.dev.acme.com',
  logLevel: 'debug',
  featureFlags: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enableDevTools: true,
    enableMockData: false,
  },
};
