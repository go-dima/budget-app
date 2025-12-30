import { Alert, Card, Spin, Typography } from "antd";
import { TransactionTable } from "../components/pure";
import { useAccounts, useTransactions } from "../hooks";
import "./ListPage.css";

const { Title } = Typography;

export function ListPage() {
  const { transactions, isLoading, error } = useTransactions();
  const { accounts } = useAccounts();

  const accountNames = accounts.reduce(
    (acc, account) => {
      acc[account.id] = account.name;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="list-page">
      <Title level={2}>Transactions</Title>

      {isLoading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          type="error"
          message="Error loading transactions"
          description={error.message}
        />
      ) : (
        <Card>
          <TransactionTable
            transactions={transactions}
            accountNames={accountNames}
          />
        </Card>
      )}
    </div>
  );
}
