import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorHandlers } from './monitoring/errorReporter';
import { initializePerformanceMonitoring } from './monitoring/performanceMonitor';
import './styles/app.css';
import './styles/tickets.css';

installGlobalErrorHandlers();
initializePerformanceMonitoring();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Provider store={store}>
          <AppRoutes />
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
