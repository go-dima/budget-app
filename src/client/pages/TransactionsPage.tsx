import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions.js';
import { useFilters } from '../contexts/FilterContext.js';
import { TransactionTable } from '../components/TransactionTable/TransactionTable.js';
import { AmountDisplay } from '../components/AmountDisplay/AmountDisplay.js';
import type { TransactionFilters } from '../../shared/types.js';

const { Title } = Typography;

export function TransactionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setSearch, setSortBy, setSortOrder, setPage, allCategories } = useFilters();

  // Read URL category param once on mount into local state, then clear the URL.
  // Navigation from Reports/Accounts works, but refresh returns to unfiltered.
  const [pageCategoryIds, setPageCategoryIds] = useState<string[]>(() => {
    const ids = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    return ids?.length ? ids : [];
  });

  useEffect(() => {
    if (searchParams.get('categoryIds')) {
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear excludeCategories when page-local category filter is active so
  // explicitly-selected categories always show regardless of default exclusions.
  const overrides: Partial<TransactionFilters> | undefined = pageCategoryIds.length
    ? { categoryIds: pageCategoryIds, excludeCategories: [] }
    : undefined;

  const { data, isLoading } = useTransactions(overrides);

  const isEmpty = !isLoading && data.total === 0 && !filters.search && pageCategoryIds.length === 0;

  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={3}>No data yet.</Title>
        <Typography.Text>
          <a onClick={() => navigate('/settings/import')}>Import transactions</a> to get started.
        </Typography.Text>
      </div>
    );
  }

  return (
    <div>
      {/* Quick Stats */}
      <Card style={{ marginBottom: 16 }}>
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
        onSearch={setSearch}
        onSort={(sortBy, sortOrder) => {
          setSortBy(sortBy as TransactionFilters['sortBy']);
          setSortOrder(sortOrder);
        }}
        onPageChange={page => setPage(page)}
      />
    </div>
  );
}
