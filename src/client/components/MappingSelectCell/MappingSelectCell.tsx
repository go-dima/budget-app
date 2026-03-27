import { memo, useRef, useState } from 'react';
import { Select, Typography } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import styles from './MappingSelectCell.module.css';

export interface MappingSelectCellProps {
  value: string | null;
  valueLabel?: string;
  options: { value: string; label: string }[];
  onSave: (val: string) => void;
  placeholder?: string;
  dir?: string;
}

export const MappingSelectCell = memo(function MappingSelectCell({
  value,
  valueLabel,
  options,
  onSave,
  placeholder = 'None — choose one',
  dir,
}: MappingSelectCellProps) {
  const [editing, setEditing] = useState(false);
  const committedRef = useRef(false);

  if (editing) {
    return (
      <Select
        autoFocus
        showSearch
        defaultOpen
        className={styles.selectCell}
        value={value ?? undefined}
        options={options}
        optionFilterProp="label"
        onChange={(val: string) => {
          committedRef.current = true;
          onSave(val);
          setEditing(false);
        }}
        onBlur={() => {
          if (!committedRef.current) setEditing(false);
          committedRef.current = false;
        }}
      />
    );
  }

  if (value === null) {
    return (
      <span className={styles.dropdownCell} onClick={() => setEditing(true)}>
        <Typography.Text type="warning" italic>{placeholder}</Typography.Text>
        <DownOutlined className={styles.caret} />
      </span>
    );
  }

  return (
    <span dir={dir} className={styles.dropdownCell} onClick={() => setEditing(true)}>
      <span className={styles.label}>{valueLabel ?? value}</span>
      <DownOutlined className={styles.caret} />
    </span>
  );
});
