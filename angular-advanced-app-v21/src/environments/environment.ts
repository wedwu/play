// ============================================================
// ENVIRONMENT — Local (default, used in development)
// ============================================================

/** Shape shared by every environment configuration. */
export interface Environment {
  /** Human-readable environment name. */
  name: 'local' | 'dev' | 'staging' | 'production';
  /** Whether Angular's production mode is enabled. */
  production: boolean;
  /** Base URL for all REST API requests. */
  apiUrl: string;
  /** WebSocket server URL. */
  wsUrl: string;
  /** OAuth / auth service domain. */
  authDomain: string;
  /** Minimum log level written to the console. */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Feature-flag map for toggling optional capabilities per environment. */
  featureFlags: {
    /** Enables product-analytics event tracking. */
    enableAnalytics: boolean;
    /** Enables remote error-reporting (e.g. Sentry). */
    enableErrorReporting: boolean;
    /** Enables Angular DevTools and verbose console output. */
    enableDevTools: boolean;
    /** Serves in-memory mock data instead of hitting the real API. */
    enableMockData: boolean;
  };
}

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
