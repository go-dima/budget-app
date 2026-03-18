import { Route, Routes } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext.js';
import { AppLayout } from './components/AppLayout/AppLayout.js';
import { AccountsPage } from './pages/AccountsPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { ImportPage } from './pages/ImportPage.js';
import { ConfigPage } from './pages/ConfigPage.js';

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </AppLayout>
  );
}

export function App() {
  return (
    <FilterProvider>
      <AppRoutes />
    </FilterProvider>
  );
}
