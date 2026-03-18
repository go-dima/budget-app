import { useState } from 'react';
import { Card, Segmented, Table, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useReport } from '../hooks/useReports.js';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart/MonthlyTrendChart.js';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart/CategoryBreakdownChart.js';
import { AmountDisplay } from '../components/AmountDisplay/AmountDisplay.js';
import type { ReportGrouping, MonthlyReportRow, YearlyReportRow, CategoryReportRow } from '../../shared/types.js';

const { Title } = Typography;

const GROUPING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'category', label: 'Category' },
];

function MonthlyTable({ data }: { data: MonthlyReportRow[] }) {
  const columns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Income', dataIndex: 'income', key: 'income', render: (v: number) => <AmountDisplay amount={v} /> },
    { title: 'Expenses', dataIndex: 'expenses', key: 'expenses', render: (v: number) => <AmountDisplay amount={-v} /> },
    { title: 'Net', dataIndex: 'net', key: 'net', render: (v: number) => <AmountDisplay amount={v} showSign /> },
    { title: 'Top Category', dataIndex: 'topCategory', key: 'topCategory', render: (v: string | null) => v ? <span dir="rtl">{v}</span> : '—' },
  ];
  return <Table dataSource={data} columns={columns} rowKey="month" pagination={false} size="small" />;
}

function YearlyTable({ data }: { data: YearlyReportRow[] }) {
  const columns = [
    { title: 'Year', dataIndex: 'year', key: 'year' },
    { title: 'Income', dataIndex: 'income', key: 'income', render: (v: number) => <AmountDisplay amount={v} /> },
    { title: 'Expenses', dataIndex: 'expenses', key: 'expenses', render: (v: number) => <AmountDisplay amount={-v} /> },
    { title: 'Net', dataIndex: 'net', key: 'net', render: (v: number) => <AmountDisplay amount={v} showSign /> },
    { title: 'Avg Monthly', dataIndex: 'avgMonthly', key: 'avgMonthly', render: (v: number) => <AmountDisplay amount={-v} /> },
  ];
  return <Table dataSource={data} columns={columns} rowKey="year" pagination={false} size="small" />;
}

function CategoryTable({ data, onCategoryClick }: { data: CategoryReportRow[]; onCategoryClick: (id: string) => void }) {
  const columns = [
    { title: 'Category', dataIndex: 'categoryName', key: 'categoryName', render: (v: string) => <span dir="rtl">{v}</span> },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => <AmountDisplay amount={-v} /> },
    { title: '% of Total', dataIndex: 'percentage', key: 'percentage', render: (v: number) => `${v}%` },
    { title: 'Count', dataIndex: 'count', key: 'count' },
    { title: 'Avg Transaction', dataIndex: 'avgTransaction', key: 'avgTransaction', render: (v: number) => <AmountDisplay amount={-v} /> },
  ];
  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="categoryId"
      pagination={false}
      size="small"
      onRow={row => ({ onClick: () => onCategoryClick(row.categoryId) })}
      rowClassName={() => 'clickable-row'}
    />
  );
}

export function ReportsPage() {
  const [grouping, setGrouping] = useState<ReportGrouping>('monthly');
  const { data, isLoading } = useReport(grouping);
  const navigate = useNavigate();

  return (
    <div>
      <Title level={3}>Reports</Title>

      <Segmented
        options={GROUPING_OPTIONS}
        value={grouping}
        onChange={v => setGrouping(v as ReportGrouping)}
        style={{ marginBottom: 24 }}
      />

      <Card loading={isLoading} style={{ marginBottom: 24 }}>
        {data.length === 0 ? (
          <Typography.Text type="secondary">No data for the selected filters.</Typography.Text>
        ) : grouping === 'monthly' ? (
          <MonthlyTable data={data as MonthlyReportRow[]} />
        ) : grouping === 'yearly' ? (
          <YearlyTable data={data as YearlyReportRow[]} />
        ) : (
          <CategoryTable
            data={data as CategoryReportRow[]}
            onCategoryClick={id => navigate(`/transactions?categoryIds=${id}`)}
          />
        )}
      </Card>

      {grouping !== 'category' && (
        <Card title="Trend Chart">
          <MonthlyTrendChart
            data={(data as MonthlyReportRow[]).map(r => ({
              month: 'month' in r ? r.month : (r as YearlyReportRow).year,
              income: r.income,
              expenses: r.expenses,
            }))}
          />
        </Card>
      )}
      {grouping === 'category' && (
        <Card title="Category Breakdown">
          <CategoryBreakdownChart
            data={(data as CategoryReportRow[]).map(r => ({
              categoryId: r.categoryId,
              categoryName: r.categoryName,
              total: r.total,
              percentage: r.percentage,
              count: r.count,
            }))}
            onCategoryClick={id => navigate(`/transactions?categoryIds=${id}`)}
          />
        </Card>
      )}
    </div>
  );
}
