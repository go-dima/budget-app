import { memo } from 'react';
import { Tag, Typography } from 'antd';

export interface ChipItem {
  key: string;
  label: string;
}

interface SuggestedChipsProps {
  items: ChipItem[];
  canRemove: boolean;
  onSelect: (key: string) => void;
  onRemove?: (key: string) => void;
}

export const SuggestedChips = memo(function SuggestedChips({ items, canRemove, onSelect, onRemove }: SuggestedChipsProps) {
  if (items.length === 0) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <span>
      {items.map(item => (
        <Tag
          key={item.key}
          closable={canRemove}
          onClose={canRemove ? () => onRemove?.(item.key) : undefined}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(item.key)}
          title="Click to set as preferred"
        >
          {item.label}
        </Tag>
      ))}
    </span>
  );
});
