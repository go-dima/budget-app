import { Alert, Col, Row, Spin, Typography } from "antd";
import { SummaryCard } from "../components/pure";
import { useOverview } from "../hooks";
import "./OverviewPage.css";

const { Title } = Typography;

export function OverviewPage() {
  const { overview, isLoading, error } = useOverview();

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Error loading overview"
        description={error.message}
      />
    );
  }

  if (!overview) {
    return (
      <Alert
        type="info"
        message="No data available"
        description="Import an Excel file to get started"
      />
    );
  }

  return (
    <div className="overview-page">
      <Title level={2}>Overview</Title>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <SummaryCard
            title="Overall Summary"
            totalIncome={overview.overall.total_income}
            totalExpense={overview.overall.total_expense}
            balance={overview.overall.balance}
            transactionCount={overview.overall.transaction_count}
            lastTransactionDate={overview.overall.last_transaction_date}
            isOverall
          />
        </Col>

        {overview.accounts.map((account) => (
          <Col xs={24} md={12} lg={8} key={account.account_id}>
            <SummaryCard
              title={account.account_name}
              totalIncome={account.total_income}
              totalExpense={account.total_expense}
              balance={account.balance}
              transactionCount={account.transaction_count}
              lastTransactionDate={account.last_transaction_date}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
