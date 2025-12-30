import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { AggregatedReportItem } from "../../../types";
import { formatCurrency, formatPeriod } from "../../../utils";
import "./ReportTable.css";

export interface ReportTableProps {
  data: AggregatedReportItem[];
  loading?: boolean;
  groupBy: "month" | "category" | "year";
}

export function ReportTable({
  data,
  loading = false,
  groupBy,
}: ReportTableProps) {
  const columns: ColumnsType<AggregatedReportItem> = [
    {
      title: groupBy === "category" ? "קטגוריה" : "תקופה",
      dataIndex: "period",
      key: "period",
      render: (period: string) => formatPeriod(period),
    },
    {
      title: "זכות",
      dataIndex: "income",
      key: "income",
      align: "right",
      render: (income: number) => (
        <span className="income">{formatCurrency(income)}</span>
      ),
      sorter: (a, b) => a.income - b.income,
    },
    {
      title: "חובה",
      dataIndex: "expense",
      key: "expense",
      align: "right",
      render: (expense: number) => (
        <span className="expense">{formatCurrency(expense)}</span>
      ),
      sorter: (a, b) => a.expense - b.expense,
    },
    {
      title: "יתרה נטו",
      dataIndex: "net_balance",
      key: "net_balance",
      align: "right",
      render: (balance: number) => (
        <span className={balance >= 0 ? "positive" : "negative"}>
          {formatCurrency(balance)}
        </span>
      ),
      sorter: (a, b) => a.net_balance - b.net_balance,
    },
    {
      title: "תנועות",
      dataIndex: "transaction_count",
      key: "transaction_count",
      align: "right",
      render: (count: number) => count.toLocaleString(),
      sorter: (a, b) => a.transaction_count - b.transaction_count,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="period"
      loading={loading}
      pagination={{
        defaultPageSize: 12,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
      }}
      className="report-table"
    />
  );
}
