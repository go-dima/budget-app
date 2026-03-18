import { useState } from 'react';
import { Layout, Button, Badge } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { NavBar } from '../NavBar/NavBar.js';
import { FilterSidebar, FilterForm } from '../FilterSidebar/FilterSidebar.js';
import { useFilters } from '../../contexts/FilterContext.js';

const { Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    filters, sidebarAccounts, allCategories,
    setAccountIds, setExcludeCategories, setDateRange, setType, resetFilters,
  } = useFilters();

  const isImportPage = location.pathname === '/import' || location.pathname === '/config';
  const hasActiveFilters = !!(filters.accountIds?.length || filters.excludeCategories?.length || (filters.type && filters.type !== 'all'));

  const filterFormProps = {
    filters,
    accounts: sidebarAccounts,
    categories: allCategories,
    onSetAccountIds: setAccountIds,
    onSetExcludeCategories: setExcludeCategories,
    onSetDateRange: setDateRange,
    onSetType: setType,
    onReset: resetFilters,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Layout>
        {!isImportPage && (
          <>
            {/* Desktop sidebar */}
            <Sider
              width={260}
              style={{ background: '#fff', padding: 16, borderRight: '1px solid #f0f0f0' }}
              className="desktop-sider"
            >
              <FilterForm {...filterFormProps} />
            </Sider>

            {/* Mobile filter button */}
            <div className="mobile-filter-btn" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
              <Badge dot={hasActiveFilters}>
                <Button type="primary" shape="circle" icon={<FilterOutlined />} size="large" onClick={() => setDrawerOpen(true)} />
              </Badge>
            </div>

            <FilterSidebar {...filterFormProps} drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
          </>
        )}
        <Content style={{ padding: isImportPage ? 24 : '24px 24px 24px 16px', overflowY: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
