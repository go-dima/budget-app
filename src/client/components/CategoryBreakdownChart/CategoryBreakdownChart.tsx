import { Empty } from 'antd';
import type { TopCategoryItem } from '../../../shared/types.js';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';

interface CategoryBreakdownChartProps {
  data: TopCategoryItem[];
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryBreakdownChart({ data, onCategoryClick }: CategoryBreakdownChartProps) {
  if (data.length === 0) return <Empty description="No expense data" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(item => (
        <div
          key={item.categoryId}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          onClick={() => onCategoryClick?.(item.categoryId)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>{item.categoryName}</span>
            <span><AmountDisplay amount={-item.total} /> ({item.percentage}%)</span>
          </div>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6 }}>
            <div style={{ background: '#ff4d4f', borderRadius: 4, height: '100%', width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
