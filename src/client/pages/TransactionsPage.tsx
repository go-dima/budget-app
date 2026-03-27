import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions.js';
import { useFilters } from '../contexts/FilterContext.js';
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
  const { filters, setSearch, setAccountIds, setSortBy, setSortOrder, setPage, setPageSize, allCategories } = useFilters();

  // Read URL category/account params once on mount into local state, then clear them from URL.
  const [pageCategoryIds, setPageCategoryIds] = useState<string[]>(() => {
    const ids = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    return ids?.length ? ids : [];
  });

  useEffect(() => {
    const accountParam = searchParams.get('accountIds');
    if (accountParam) {
      const ids = accountParam.split(',').filter(Boolean);
      if (ids.length > 0) setAccountIds(ids);
    }
    if (searchParams.get('categoryIds') || accountParam) {
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
  const overrides: Partial<TransactionFilters> | undefined =
    (pageCategoryIds.length || navigatedWithSearch)
      ? {
          ...(pageCategoryIds.length ? { categoryIds: pageCategoryIds } : {}),
          excludeCategories: [],
          ...(navigatedWithSearch ? { startDate: undefined, endDate: undefined } : {}),
        }
      : undefined;

  const { data, isLoading } = useTransactions(overrides);

  const isEmpty = !isLoading && data.total === 0 && !filters.search && pageCategoryIds.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title="No data yet."
        action={<Typography.Text><a onClick={() => navigate('/settings/import')}>Import transactions</a> to get started.</Typography.Text>}
      />
    );
  }

  return (
    <div>
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
        initialSearch={filters.search}
        onSearch={setSearch}
        onSort={(sortBy, sortOrder) => {
          setSortBy(sortBy as TransactionFilters['sortBy']);
          setSortOrder(sortOrder);
        }}
        onPageChange={(page, pageSize) => { setPage(page); setPageSize(pageSize); }}
      />
    </div>
  );
}
