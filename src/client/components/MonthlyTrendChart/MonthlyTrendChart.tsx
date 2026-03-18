import { Empty, Typography } from 'antd';
import type { MonthlyTrendItem } from '../../../shared/types.js';

const { Text } = Typography;

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length < 2) {
    return <Empty description="Select a longer date range to see trends." />;
  }

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]));

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', minWidth: data.length * 60, padding: '8px 0' }}>
        {data.map(item => (
          <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
              <div style={{ flex: 1, background: '#52c41a', borderRadius: 2, height: maxVal > 0 ? `${(item.income / maxVal) * 100}%` : 0, minHeight: 2 }} title={`Income: ₪${(item.income/100).toFixed(2)}`} />
              <div style={{ flex: 1, background: '#ff4d4f', borderRadius: 2, height: maxVal > 0 ? `${(item.expenses / maxVal) * 100}%` : 0, minHeight: 2 }} title={`Expenses: ₪${(item.expenses/100).toFixed(2)}`} />
            </div>
            <Text style={{ fontSize: 10, textAlign: 'center' }}>{item.month.slice(2)}</Text>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        <span style={{ color: '#52c41a' }}>■ Income</span>
        <span style={{ color: '#ff4d4f' }}>■ Expenses</span>
      </div>
    </div>
  );
}
