import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

interface CategorySelectProps {
  value?: string | null;
  options: DefaultOptionType[];
  placeholder?: string;
  onChange: (value: string | undefined) => void;
  onClear?: () => void;
  style?: React.CSSProperties;
}

export function CategorySelect({ value, options, placeholder = 'Select category', onChange, onClear, style }: CategorySelectProps) {
  return (
    <Select
      value={value ?? undefined}
      showSearch
      allowClear
      options={options}
      placeholder={placeholder}
      optionFilterProp="label"
      style={{ width: '100%', ...style }}
      onChange={(val: string | undefined) => onChange(val)}
      onClear={onClear}
    />
  );
}
