import { useState } from 'react';
import { Card, Segmented, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { txnsByCategoryUrl } from '../utils/navigation.js';
import { useReport, useMonthDetail, useYearDetail } from '../hooks/useReports.js';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart/MonthlyTrendChart.js';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart/CategoryBreakdownChart.js';
import { MonthlyTable, YearlyTable, CategoryTable, MonthDetailTable } from '../components/ReportTables/ReportTables.js';
import type { ReportGrouping, MonthlyReportRow, YearlyReportRow, CategoryReportRow } from '../../shared/types.js';

const { Title } = Typography;

function MonthDetailPanel({ month }: { month: string }) {
  const { data, isLoading } = useMonthDetail(month);
  return <MonthDetailTable data={data} loading={isLoading} />;
}

function YearDetailPanel({ year }: { year: string }) {
  const { data, isLoading } = useYearDetail(year);
  return <MonthlyTable data={data} loading={isLoading} />;
}

const GROUPING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'category', label: 'Category' },
];

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
        className="mb-24"
      />

      <Card loading={isLoading} className="mb-24">
        {data.length === 0 ? (
          <Typography.Text type="secondary">No data for the selected filters.</Typography.Text>
        ) : grouping === 'monthly' ? (
          <MonthlyTable
            data={data as MonthlyReportRow[]}
            expandedRowRender={r => <MonthDetailPanel month={r.month} />}
          />
        ) : grouping === 'yearly' ? (
          <YearlyTable
            data={data as YearlyReportRow[]}
            expandedRowRender={r => <YearDetailPanel year={r.year} />}
          />
        ) : (
          <CategoryTable
            data={data as CategoryReportRow[]}
            onCategoryClick={id => navigate(txnsByCategoryUrl(id))}
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
            onCategoryClick={id => navigate(txnsByCategoryUrl(id))}
          />
        </Card>
      )}
    </div>
  );
}
