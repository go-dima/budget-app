import { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';

interface ToolbarSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** If set, fires onChange after this many ms of inactivity instead of on Enter */
  debounceMs?: number;
  style?: React.CSSProperties;
}

export function ToolbarSearch({ placeholder, value, onChange, debounceMs, style }: ToolbarSearchProps) {
  const [local, setLocal] = useState(value);
  const mounted = useRef(false);

  // Sync when external value changes (e.g. reset)
  useEffect(() => { setLocal(value); }, [value]);

  // Debounced fire
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (debounceMs == null) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  if (debounceMs != null) {
    return (
      <Input
        placeholder={placeholder}
        value={local}
        onChange={e => { setLocal(e.target.value); if (!e.target.value) onChange(''); }}
        allowClear
        style={{ flex: 1, minWidth: 160, ...style }}
      />
    );
  }

  return (
    <Input.Search
      placeholder={placeholder}
      value={local}
      onChange={e => { setLocal(e.target.value); if (!e.target.value) onChange(''); }}
      onSearch={onChange}
      allowClear
      style={{ flex: 1, minWidth: 160, ...style }}
    />
  );
}
