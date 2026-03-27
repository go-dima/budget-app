import { Navigate, Route, Routes } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext.js';
import { AppLayout } from './components/AppLayout/AppLayout.js';
import { AccountsPage } from './pages/AccountsPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { ImportPage } from './pages/ImportPage.js';
import { ConfigPage } from './pages/ConfigPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { DatabasesPage } from './pages/DatabasesPage.js';
import { CategoryMappingPage } from './pages/CategoryMappingPage.js';

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="/settings/categories" replace />} />
          <Route path="categories" element={<ConfigPage />} />
          <Route path="databases" element={<DatabasesPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="mapping" element={<CategoryMappingPage />} />
        </Route>
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
