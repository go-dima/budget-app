import { useRef, useState } from 'react';
import { Select, Tag } from 'antd';

interface MultiSelectFilterProps {
  value: string[];
  onChange: (ids: string[]) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  tagColor?: string;
  rtl?: boolean;
  style?: React.CSSProperties;
}

export function MultiSelectFilter({
  value, onChange, options, placeholder, tagColor = 'blue', rtl = false, style,
}: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');
  const selectRef = useRef<{ blur: () => void }>(null);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab' && search.trim()) {
      e.preventDefault();
      const first = filtered.find(o => !value.includes(o.value));
      if (first) { onChange([...value, first.value]); setSearch(''); }
    }
    if (e.key === 'Enter') {
      setTimeout(() => selectRef.current?.blur(), 0);
    }
  }

  return (
    <Select
      ref={selectRef as React.Ref<never>}
      mode="multiple"
      value={value}
      onChange={ids => { onChange(ids); setSearch(''); }}
      searchValue={search}
      onSearch={setSearch}
      options={filtered}
      filterOption={false}
      onInputKeyDown={handleKeyDown}
      optionRender={opt => rtl ? <span dir="rtl">{opt.label as string}</span> : <>{opt.label}</>}
      tagRender={({ label, closable, onClose }) => (
        <Tag closable={closable} onClose={onClose} color={tagColor} style={{ marginRight: 4 }}>
          {rtl ? <span dir="rtl">{label as string}</span> : label as string}
        </Tag>
      )}
      placeholder={placeholder}
      style={{ flex: 1, minWidth: 180, ...style }}
      notFoundContent={search ? 'No matches' : null}
    />
  );
}
