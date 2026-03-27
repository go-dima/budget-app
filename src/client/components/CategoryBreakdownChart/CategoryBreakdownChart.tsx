import { Empty } from 'antd';
import type { TopCategoryItem } from '../../../shared/types.js';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import styles from './CategoryBreakdownChart.module.css';

interface CategoryBreakdownChartProps {
  data: TopCategoryItem[];
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryBreakdownChart({ data, onCategoryClick }: CategoryBreakdownChartProps) {
  if (data.length === 0) return <Empty description="No expense data" />;

  return (
    <div className={styles.list}>
      {data.map(item => (
        <div
          key={item.categoryId}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          onClick={() => onCategoryClick?.(item.categoryId)}
        >
          <div className={styles.labelRow}>
            <span>{item.categoryName}</span>
            <span><AmountDisplay amount={-item.total} /> ({item.percentage}%)</span>
          </div>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
