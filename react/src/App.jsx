import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ConfigProvider>
          <AuthProvider>
            <FinanceProvider>
              <AppRoutes />
            </FinanceProvider>
          </AuthProvider>
        </ConfigProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
