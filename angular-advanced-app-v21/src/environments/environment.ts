// ============================================================
// ENVIRONMENT — Local (default, used in development)
// ============================================================

export type { Environment } from './environment.types';
import type { Environment } from './environment.types';

export const environment: Environment = {
  name: 'local',
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  authDomain: 'localhost',
  logLevel: 'debug',
  featureFlags: {
    enableAnalytics: false,
    enableErrorReporting: false,
    enableDevTools: true,
    enableMockData: true,
  },
};
