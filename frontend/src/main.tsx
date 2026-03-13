import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from 'react-error-boundary'

import { apolloClient } from '@services/apollo'
import { NotificationProvider } from '@services/notifications'
import { WebSocketProvider } from '@services/websocket'
import { ThemeProvider } from '@store/theme'
import { AuthProvider } from '@store/auth'

import App from './App'
import ErrorFallback from '@components/ErrorFallback'
import '@assets/styles/main.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Application error:', error)
        // Log to monitoring service
      }}
    >
      <HelmetProvider>
        <BrowserRouter>
          <ApolloProvider client={apolloClient}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <AuthProvider>
                  <WebSocketProvider>
                    <NotificationProvider>
                      <App />
                      {process.env.NODE_ENV === 'development' && (
                        <ReactQueryDevtools initialIsOpen={false} />
                      )}
                    </NotificationProvider>
                  </WebSocketProvider>
                </AuthProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ApolloProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)