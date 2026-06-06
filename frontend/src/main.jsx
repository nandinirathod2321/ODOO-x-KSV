import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { ThemeProvider } from './lib/context/ThemeContext.jsx';
import { ModalProvider } from './lib/context/ModalContext.jsx';
import { Toaster } from 'react-hot-toast';
import App from './routes/App.jsx';
import './lib/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModalProvider>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" />
          </BrowserRouter>
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
