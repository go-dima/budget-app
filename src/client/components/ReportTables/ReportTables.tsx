import type { ReactNode } from 'react';
import { Table } from 'antd';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { MonthlyReportRow, YearlyReportRow, CategoryReportRow, MonthDetailRow } from '../../../shared/types.js';

const MONTHLY_COLUMNS = [
  { title: 'Month', dataIndex: 'month', key: 'month', sorter: (a: MonthlyReportRow, b: MonthlyReportRow) => a.month.localeCompare(b.month) },
  { title: 'Income', dataIndex: 'income', key: 'income', sorter: (a: MonthlyReportRow, b: MonthlyReportRow) => a.income - b.income, render: (v: number) => <AmountDisplay amount={v} /> },
  { title: 'Expenses', dataIndex: 'expenses', key: 'expenses', sorter: (a: MonthlyReportRow, b: MonthlyReportRow) => a.expenses - b.expenses, render: (v: number) => <AmountDisplay amount={-v} /> },
  { title: 'Net', dataIndex: 'net', key: 'net', sorter: (a: MonthlyReportRow, b: MonthlyReportRow) => a.net - b.net, render: (v: number) => <AmountDisplay amount={v} showSign /> },
  { title: 'Top Category', dataIndex: 'topCategory', key: 'topCategory', render: (v: string | null) => v ? <span dir="rtl">{v}</span> : '—' },
];

const YEARLY_COLUMNS = [
  { title: 'Year', dataIndex: 'year', key: 'year', sorter: (a: YearlyReportRow, b: YearlyReportRow) => a.year.localeCompare(b.year) },
  { title: 'Income', dataIndex: 'income', key: 'income', sorter: (a: YearlyReportRow, b: YearlyReportRow) => a.income - b.income, render: (v: number) => <AmountDisplay amount={v} /> },
  { title: 'Expenses', dataIndex: 'expenses', key: 'expenses', sorter: (a: YearlyReportRow, b: YearlyReportRow) => a.expenses - b.expenses, render: (v: number) => <AmountDisplay amount={-v} /> },
  { title: 'Net', dataIndex: 'net', key: 'net', sorter: (a: YearlyReportRow, b: YearlyReportRow) => a.net - b.net, render: (v: number) => <AmountDisplay amount={v} showSign /> },
  { title: 'Avg Monthly', dataIndex: 'avgMonthly', key: 'avgMonthly', sorter: (a: YearlyReportRow, b: YearlyReportRow) => a.avgMonthly - b.avgMonthly, render: (v: number) => <AmountDisplay amount={-v} /> },
];

const CATEGORY_COLUMNS = [
  { title: 'Category', dataIndex: 'categoryName', key: 'categoryName', sorter: (a: CategoryReportRow, b: CategoryReportRow) => a.categoryName.localeCompare(b.categoryName), render: (v: string) => <span dir="rtl">{v}</span> },
  { title: 'Total', dataIndex: 'total', key: 'total', sorter: (a: CategoryReportRow, b: CategoryReportRow) => a.total - b.total, render: (v: number) => <AmountDisplay amount={-v} /> },
  { title: '% of Total', dataIndex: 'percentage', key: 'percentage', sorter: (a: CategoryReportRow, b: CategoryReportRow) => a.percentage - b.percentage, render: (v: number) => `${v}%` },
  { title: 'Count', dataIndex: 'count', key: 'count', sorter: (a: CategoryReportRow, b: CategoryReportRow) => a.count - b.count },
  { title: 'Avg Transaction', dataIndex: 'avgTransaction', key: 'avgTransaction', sorter: (a: CategoryReportRow, b: CategoryReportRow) => a.avgTransaction - b.avgTransaction, render: (v: number) => <AmountDisplay amount={-v} /> },
];

const MONTH_DETAIL_COLUMNS = [
  { title: 'Category', dataIndex: 'categoryName', key: 'categoryName', render: (v: string) => <span dir="rtl">{v}</span> },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <AmountDisplay amount={-v} /> },
  { title: '% of Expenses', dataIndex: 'percentage', key: 'percentage', render: (v: number) => `${v}%` },
];

export function MonthDetailTable({ data, loading }: { data: MonthDetailRow[]; loading?: boolean }) {
  return <Table dataSource={data} columns={MONTH_DETAIL_COLUMNS} rowKey="categoryId" pagination={false} size="small" loading={loading} />;
}

export function MonthlyTable({ data, loading, expandedRowRender }: { data: MonthlyReportRow[]; loading?: boolean; expandedRowRender?: (r: MonthlyReportRow) => ReactNode }) {
  return (
    <Table
      dataSource={data}
      columns={MONTHLY_COLUMNS}
      rowKey="month"
      pagination={false}
      size="small"
      loading={loading}
      expandable={expandedRowRender ? { expandedRowRender } : undefined}
    />
  );
}

export function YearlyTable({ data, expandedRowRender }: { data: YearlyReportRow[]; expandedRowRender?: (r: YearlyReportRow) => ReactNode }) {
  return (
    <Table
      dataSource={data}
      columns={YEARLY_COLUMNS}
      rowKey="year"
      pagination={false}
      size="small"
      expandable={expandedRowRender ? { expandedRowRender } : undefined}
    />
  );
}

export function CategoryTable({ data, onCategoryClick }: { data: CategoryReportRow[]; onCategoryClick: (id: string) => void }) {
  return (
    <Table
      dataSource={data}
      columns={CATEGORY_COLUMNS}
      rowKey="categoryId"
      pagination={false}
      size="small"
      onRow={row => ({ onClick: () => onCategoryClick(row.categoryId) })}
      rowClassName={() => 'clickable-row'}
    />
  );
}
