/**
 * @module App
 * @description Root component using createBrowserRouter with error boundaries,
 * lazy loading, Suspense, and structured logging.
 * Open/Closed Principle (SOLID) — extend routes without modifying core
 */

import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { logger } from '@/lib/logger';
import Layout from '@/components/Layout';

// Lazy-loaded pages (Code Splitting)
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const EventsList = lazy(() => import('@/pages/EventsList'));
const EventDetails = lazy(() => import('@/pages/EventDetails'));
const CreateEvent = lazy(() => import('@/pages/CreateEvent'));
const EditEvent = lazy(() => import('@/pages/EditEvent'));
const MyEvents = lazy(() => import('@/pages/MyEvents'));
const Users = lazy(() => import('@/pages/Users'));
const Help = lazy(() => import('@/pages/Help'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

/** Loading fallback with "Loading..." text */
const LoadingFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

/** Inline loading for nested routes */
const InlineLoading = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

/** Route logger — logs every navigation */
const RouteLogger = () => {
  const location = useLocation();
  useEffect(() => {
    logger.navigation(location.pathname + location.search);
  }, [location]);
  return null;
};

/** Root wrapper providing Suspense + route logging */
const RootLayout = () => (
  <>
    <RouteLogger />
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  </>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: (
      <Suspense fallback={<LoadingFallback />}>
        <ErrorPage />
      </Suspense>
    ),
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      {
        element: <Layout />,
        errorElement: (
          <Suspense fallback={<LoadingFallback />}>
            <ErrorPage />
          </Suspense>
        ),
        children: [
          {
            path: '/events',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <EventsList />
              </Suspense>
            ),
          },
          {
            path: '/events/create',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <CreateEvent />
              </Suspense>
            ),
          },
          {
            path: '/events/:id',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <EventDetails />
              </Suspense>
            ),
          },
          {
            path: '/events/:id/edit',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <EditEvent />
              </Suspense>
            ),
          },
          {
            path: '/my-events',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <MyEvents />
              </Suspense>
            ),
          },
          {
            path: '/users',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <Users />
              </Suspense>
            ),
          },
          {
            path: '/assistant',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <AIAssistant />
              </Suspense>
            ),
          },
          {
            path: '/help',
            element: (
              <Suspense fallback={<InlineLoading />}>
                <Help />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ErrorPage />
          </Suspense>
        ),
      },
    ],
  },
]);

logger.info('Application initialized', 'App', {
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
