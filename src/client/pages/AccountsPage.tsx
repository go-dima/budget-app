import { Button, Card, Col, Row, Statistic, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { txnsByCategoryUrl } from '../utils/navigation.js';
import { useAccounts } from '../hooks/useAccounts.js';
import { useMonthlyTrend, useTopCategories } from '../hooks/useReports.js';
import { AccountCard } from '../components/AccountCard/AccountCard.js';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart/MonthlyTrendChart.js';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart/CategoryBreakdownChart.js';
import { AmountDisplay } from '../components/AmountDisplay/AmountDisplay.js';

const { Title } = Typography;

export function AccountsPage() {
  const navigate = useNavigate();
  const { data: accounts, isLoading } = useAccounts();
  const { data: trend } = useMonthlyTrend();
  const { data: topCategories } = useTopCategories();

  if (!isLoading && accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={3}>No transaction data yet.</Title>
        <Button type="primary" size="large" onClick={() => navigate('/import')}>
          Import Data
        </Button>
      </div>
    );
  }

  const totalIncome = accounts.reduce((s, a) => s + a.totalIncome, 0);
  const totalExpenses = accounts.reduce((s, a) => s + a.totalExpenses, 0);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);

  return (
    <div>
      {/* Total Summary */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={12} sm={6}>
            <Statistic title="Total Balance" valueRender={() => <AmountDisplay amount={totalBalance} />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Total Income" valueRender={() => <AmountDisplay amount={totalIncome} />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Total Expenses" valueRender={() => <AmountDisplay amount={-totalExpenses} />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Net" valueRender={() => <AmountDisplay amount={totalIncome - totalExpenses} showSign />} />
          </Col>
        </Row>
      </Card>

      {/* Account Cards */}
      <Title level={4}>Accounts</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {accounts.map(account => (
          <Col xs={24} sm={12} lg={8} key={account.id}>
            <AccountCard
              account={account}
              onClick={() => navigate(`/transactions?accountIds=${account.id}`)}
            />
          </Col>
        ))}
      </Row>

      {/* Monthly Trend */}
      <Title level={4}>Monthly Trend</Title>
      <Card style={{ marginBottom: 24 }}>
        <MonthlyTrendChart data={trend} />
      </Card>

      {/* Top Categories */}
      <Title level={4}>Top Categories</Title>
      <Card>
        <CategoryBreakdownChart
          data={topCategories}
          onCategoryClick={id => navigate(txnsByCategoryUrl(id))}
        />
      </Card>
    </div>
  );
}
