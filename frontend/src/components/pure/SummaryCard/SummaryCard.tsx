import { Card, Statistic, Row, Col } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { formatCurrency, formatDate } from "../../../utils";
import "./SummaryCard.css";

export interface SummaryCardProps {
  title: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount?: number;
  lastTransactionDate?: number | null;
  isOverall?: boolean;
}

export function SummaryCard({
  title,
  totalIncome,
  totalExpense,
  balance,
  transactionCount,
  lastTransactionDate,
  isOverall = false,
}: SummaryCardProps) {
  return (
    <Card
      title={title}
      className={`summary-card ${isOverall ? "overall" : ""}`}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic
            title="זכות"
            value={totalIncome}
            precision={2}
            prefix={<ArrowUpOutlined />}
            styles={{ content: { color: "#3f8600" } }}
            formatter={() => formatCurrency(totalIncome)}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="חובה"
            value={totalExpense}
            precision={2}
            prefix={<ArrowDownOutlined />}
            styles={{ content: { color: "#cf1322" } }}
            formatter={() => formatCurrency(totalExpense)}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="יתרה"
            value={balance}
            precision={2}
            prefix={<WalletOutlined />}
            styles={{ content: { color: balance >= 0 ? "#3f8600" : "#cf1322" } }}
            formatter={() => formatCurrency(balance)}
          />
        </Col>
      </Row>
      {(transactionCount !== undefined || lastTransactionDate) && (
        <Row gutter={[16, 16]} className="card-footer">
          {transactionCount !== undefined && (
            <Col span={12}>
              <div className="footer-item">
                <span className="label">תנועות:</span>
                <span className="value">{transactionCount.toLocaleString()}</span>
              </div>
            </Col>
          )}
          {lastTransactionDate && (
            <Col span={12}>
              <div className="footer-item">
                <span className="label">תנועה אחרונה:</span>
                <span className="value">{formatDate(lastTransactionDate)}</span>
              </div>
            </Col>
          )}
        </Row>
      )}
    </Card>
  );
}
