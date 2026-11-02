import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryCache, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles.css';
import { ApiError, setCsrf } from './api/client';
const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!(error instanceof ApiError) || error.status !== 401 || query.queryKey[0] === 'session')
        return;
      // A revoked/expired session must not leave the previous account's data on screen.
      setCsrf('');
      queryClient.setQueryData(['session'], null);
      void queryClient.cancelQueries({ predicate: (item) => item.queryKey[0] !== 'session' });
      queryClient.removeQueries({ predicate: (item) => item.queryKey[0] !== 'session' });
    },
  }),
  defaultOptions: { queries: { retry: 1, staleTime: 15000, refetchOnWindowFocus: false } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
