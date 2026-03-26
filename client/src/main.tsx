import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import { apolloClient } from './apollo/client';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <BreadcrumbProvider>
          <App />
        </BreadcrumbProvider>
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>
);
