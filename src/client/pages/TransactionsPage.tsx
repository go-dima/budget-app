import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions.js';
import { useFilters } from '../contexts/FilterContext.js';
import { transactionsApi } from '../httpClient/client.js';
import { TransactionTable } from '../components/TransactionTable/TransactionTable.js';
import { AmountDisplay } from '../components/AmountDisplay/AmountDisplay.js';
import { EmptyState } from '../components/EmptyState/EmptyState.js';
import type { TransactionFilters } from '../../shared/types.js';


interface TransactionsPageProps {
  searchTerm?: string;
}

export function TransactionsPage({ searchTerm }: TransactionsPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setSearch, setSortBy, setSortOrder, setPage, setPageSize, allCategories, sidebarAccounts } = useFilters();

  // Read URL category/account params once on mount into local (temporal) state, then clear from URL.
  // These are page-level filters — they don't persist in FilterContext.
  const [pageCategoryIds, setPageCategoryIds] = useState<string[]>(() => {
    const ids = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    return ids?.length ? ids : [];
  });

  const [pageAccountIds, setPageAccountIds] = useState<string[]>(() => {
    const ids = searchParams.get('accountIds')?.split(',').filter(Boolean);
    return ids?.length ? ids : [];
  });

  const [pageDateRange, setPageDateRange] = useState<[string, string] | null>(null);
  const [pageAmountRange, setPageAmountRange] = useState<{ min?: number; max?: number }>({});
  const [pagePaymentMethods, setPagePaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get('categoryIds') || searchParams.get('accountIds')) {
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed search from navigation state (e.g. clicking a description in CategoryMappingPage)
  // or from the searchTerm prop. Router state is preferred — no URL race condition.
  // Also track whether we arrived with a navigated search so excludeCategories can be cleared.
  const [navigatedWithSearch, setNavigatedWithSearch] = useState<boolean>(() =>
    !!(location.state as { search?: string } | null)?.search || !!searchTerm
  );

  useEffect(() => {
    const stateSearch = (location.state as { search?: string } | null)?.search;
    const initial = stateSearch ?? searchTerm;
    if (initial) {
      setSearch(initial);
      setNavigatedWithSearch(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear excludeCategories + date range when arriving via a navigated search so all
  // matching transactions are visible regardless of category exclusions or date window.
  // Also clear date range for pageCategoryIds to show the full picture per category.
  const hasAmountRange = pageAmountRange.min != null || pageAmountRange.max != null;
  const overrides: Partial<TransactionFilters> | undefined =
    (pageAccountIds.length || pageCategoryIds.length || navigatedWithSearch || pageDateRange || hasAmountRange || pagePaymentMethods.length)
      ? {
          ...(pageAccountIds.length ? { accountIds: pageAccountIds, startDate: undefined, endDate: undefined } : {}),
          ...(pageCategoryIds.length ? { categoryIds: pageCategoryIds } : {}),
          excludeCategories: [],
          ...(navigatedWithSearch ? { startDate: undefined, endDate: undefined } : {}),
          ...(pageDateRange ? { startDate: pageDateRange[0], endDate: pageDateRange[1] } : {}),
          ...(pageAmountRange.min != null ? { amountMin: pageAmountRange.min } : {}),
          ...(pageAmountRange.max != null ? { amountMax: pageAmountRange.max } : {}),
          ...(pagePaymentMethods.length ? { paymentMethods: pagePaymentMethods } : {}),
        }
      : undefined;

  const { data, isLoading, reload } = useTransactions(overrides);

  async function handleCategoryChange(id: string, categoryId: string | null) {
    await transactionsApi.bulkCategorize([{ id, categoryId }]);
    reload();
  }

  async function handlePaymentMethodChange(id: string, paymentMethod: string) {
    await transactionsApi.bulkSetPaymentMethod([{ id, paymentMethod }]);
    reload();
  }

  const isEmpty = !isLoading && data.total === 0 && !filters.search && pageCategoryIds.length === 0 && pageAccountIds.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title="No data yet."
        action={<Typography.Text><a onClick={() => navigate('/settings/import')}>Import transactions</a> to get started.</Typography.Text>}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Quick Stats */}
      <Card className="mb-16">
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic title="Showing" value={data.total} suffix="transactions" />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Total Income" valueRender={() => <AmountDisplay amount={data.totalIncome} />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Total Expenses" valueRender={() => <AmountDisplay amount={-data.totalExpenses} />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Net" valueRender={() => <AmountDisplay amount={data.totalIncome - data.totalExpenses} showSign />} />
          </Col>
        </Row>
      </Card>

      <TransactionTable
        transactions={data.transactions}
        total={data.total}
        page={filters.page ?? 1}
        pageSize={filters.pageSize ?? 50}
        isLoading={isLoading}
        allCategories={allCategories}
        pageCategoryIds={pageCategoryIds}
        onPageCategoryChange={setPageCategoryIds}
        pageAccountIds={pageAccountIds}
        onPageAccountChange={setPageAccountIds}
        accountOptions={sidebarAccounts.map(a => ({ value: a.id, label: a.name }))}
        pageDateRange={pageDateRange}
        onPageDateRangeChange={setPageDateRange}
        pageAmountRange={pageAmountRange}
        onPageAmountRangeChange={setPageAmountRange}
        pagePaymentMethods={pagePaymentMethods}
        onPagePaymentMethodsChange={setPagePaymentMethods}
        initialSearch={filters.search}
        onSearch={setSearch}
        onSort={(sortBy, sortOrder) => {
          setSortBy(sortBy as TransactionFilters['sortBy']);
          setSortOrder(sortOrder);
        }}
        onPageChange={(page, pageSize) => {
          if (pageSize !== filters.pageSize) setPageSize(pageSize);
          else setPage(page);
        }}
        onCategoryChange={handleCategoryChange}
        onPaymentMethodChange={handlePaymentMethodChange}
      />
    </div>
  );
}
