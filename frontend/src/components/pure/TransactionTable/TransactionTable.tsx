import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Transaction } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils";
import "./TransactionTable.css";

export interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  accountNames?: Record<string, string>;
}

export function TransactionTable({
  transactions,
  loading = false,
  accountNames = {},
}: TransactionTableProps) {
  const columns: ColumnsType<Transaction> = [
    {
      title: "תאריך",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date: number) => formatDate(date),
      sorter: (a, b) => a.date - b.date,
      defaultSortOrder: "descend",
    },
    {
      title: "תיאור",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "קטגוריה",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
      filters: [...new Set(transactions.map((t) => t.category))].map((cat) => ({
        text: cat,
        value: cat,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "אמצעי תשלום",
      dataIndex: "payment_method",
      key: "payment_method",
      width: 130,
      render: (method: string | null) => method || "-",
    },
    {
      title: "חשבון",
      dataIndex: "account_id",
      key: "account_id",
      width: 130,
      render: (id: string) => accountNames[id] || id,
    },
    {
      title: "זכות",
      dataIndex: "income",
      key: "income",
      width: 120,
      align: "right",
      render: (income: number) =>
        income > 0 ? (
          <span className="income">{formatCurrency(income)}</span>
        ) : (
          "-"
        ),
      sorter: (a, b) => a.income - b.income,
    },
    {
      title: "חובה",
      dataIndex: "expense",
      key: "expense",
      width: 120,
      align: "right",
      render: (expense: number) =>
        expense > 0 ? (
          <span className="expense">{formatCurrency(expense)}</span>
        ) : (
          "-"
        ),
      sorter: (a, b) => a.expense - b.expense,
    },
    {
      title: "יתרה",
      dataIndex: "balance",
      key: "balance",
      width: 120,
      align: "right",
      render: (balance: number) => formatCurrency(balance),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={transactions}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} transactions`,
      }}
      scroll={{ x: 1000 }}
      className="transaction-table"
    />
  );
}
