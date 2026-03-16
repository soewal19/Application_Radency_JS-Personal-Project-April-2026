/**
 * @module ErrorPage
 * @description React Router error boundary page — catches route-level errors
 */

import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const isRouteError = isRouteErrorResponse(error);
  const status = isRouteError ? error.status : 500;
  const message = isRouteError
    ? error.statusText || 'Something went wrong'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  useEffect(() => {
    logger.error(`Route error: ${status} — ${message}`, 'ErrorBoundary', error);
  }, [error, status, message]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="mb-2 text-6xl font-bold text-foreground">{status}</h1>
        <p className="mb-2 text-xl font-semibold text-foreground">
          {status === 404 ? 'Page Not Found' : 'Something Went Wrong'}
        </p>
        <p className="mb-8 text-sm text-muted-foreground">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
