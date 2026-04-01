import { useMemo, useState } from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import { NavBar } from '../NavBar/NavBar.js';
import { FilterForm } from '../FilterSidebar/FilterForm.js';
import { FilterSidebar } from '../FilterSidebar/FilterSidebar.js';
import { useFilters } from '../../contexts/FilterContext.js';
import styles from './AppLayout.module.css';

const { Sider, Content } = Layout;

const LAYOUT_STYLE = { height: '100vh', overflow: 'hidden' as const };
const INNER_LAYOUT_STYLE = { overflow: 'hidden' as const, flex: 1 };
const CONTENT_STYLE_IMPORT = { padding: 24, overflowY: 'auto' as const, flex: 1 };
const CONTENT_STYLE_MAIN = { padding: '24px 24px 24px 16px', overflowY: 'auto' as const, flex: 1 };

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    filters, sidebarAccounts, allCategories, defaultExcludedIds,
    setAccountIds, setExcludeCategories, setDateRange, setType, resetFilters,
  } = useFilters();

  const isImportPage = location.pathname.startsWith('/settings');

  const filterFormProps = useMemo(() => ({
    filters,
    accounts: sidebarAccounts,
    categories: allCategories,
    defaultExcludedIds,
    onSetAccountIds: setAccountIds,
    onSetExcludeCategories: setExcludeCategories,
    onSetDateRange: setDateRange,
    onSetType: setType,
    onReset: resetFilters,
  }), [filters, sidebarAccounts, allCategories, defaultExcludedIds, setAccountIds, setExcludeCategories, setDateRange, setType, resetFilters]);

  return (
    <Layout style={LAYOUT_STYLE}>
      <NavBar />
      <Layout style={INNER_LAYOUT_STYLE}>
        {!isImportPage && (
          <>
            {/* Desktop sidebar */}
            <Sider
              width={260}
              className={`${styles.sider} desktop-sider`}
            >
              <FilterForm {...filterFormProps} />
            </Sider>

<FilterSidebar {...filterFormProps} drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
          </>
        )}
        <Content style={isImportPage ? CONTENT_STYLE_IMPORT : CONTENT_STYLE_MAIN}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
