// src/utils/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Obtém o DSN do arquivo .env
  tracesSampleRate: 1.0, // Taxa de amostragem para transações (1.0 = 100%)
  environment: process.env.NODE_ENV || 'development', // Define o ambiente (produção ou desenvolvimento)
});

export { Sentry };
