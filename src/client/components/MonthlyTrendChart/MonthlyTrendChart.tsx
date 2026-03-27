import { Empty, Typography } from 'antd';
import type { MonthlyTrendItem } from '../../../shared/types.js';
import styles from './MonthlyTrendChart.module.css';

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
    <div className={styles.scroll}>
      <div className={styles.bars} style={{ minWidth: data.length * 60 }}>
        {data.map(item => (
          <div key={item.month} className={styles.monthCol}>
            <div className={styles.barPair}>
              <div
                className={styles.bar}
                style={{ background: '#52c41a', height: maxVal > 0 ? `${(item.income / maxVal) * 100}%` : 0 }}
                title={`Income: ₪${(item.income/100).toFixed(2)}`}
              />
              <div
                className={styles.bar}
                style={{ background: '#ff4d4f', height: maxVal > 0 ? `${(item.expenses / maxVal) * 100}%` : 0 }}
                title={`Expenses: ₪${(item.expenses/100).toFixed(2)}`}
              />
            </div>
            <Text className={styles.monthLabel}>{item.month.slice(2)}</Text>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendIncome}>■ Income</span>
        <span className={styles.legendExpense}>■ Expenses</span>
      </div>
    </div>
  );
}
