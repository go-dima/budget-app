import { useState } from 'react';
import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

interface SearchableDropdownProps {
  value?: string | null;
  options: DefaultOptionType[];
  placeholder?: string;
  onChange: (value: string | undefined) => void;
  onClear?: () => void;
  onBlur?: () => void;
  allowCreate?: boolean;
  style?: React.CSSProperties;
}

export function SearchableDropdown({
  value, options, placeholder = 'Select...', onChange, onClear, onBlur, allowCreate, style,
}: SearchableDropdownProps) {
  const [search, setSearch] = useState('');

  const resolvedOptions =
    allowCreate && search && !options.some(o => String(o.value) === search)
      ? [...options, { value: search, label: `Use: "${search}"` }]
      : options;

  return (
    <Select
      showSearch
      allowClear
      value={value ?? undefined}
      options={resolvedOptions}
      placeholder={placeholder}
      optionFilterProp="label"
      style={{ width: '100%', ...style }}
      onChange={(val: string | undefined) => { onChange(val); if (allowCreate) setSearch(''); }}
      onClear={onClear}
      onSearch={allowCreate ? setSearch : undefined}
      onBlur={onBlur}
    />
  );
}
