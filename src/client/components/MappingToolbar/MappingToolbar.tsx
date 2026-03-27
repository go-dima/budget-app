import { useState } from 'react';
import { AutoComplete, Button, Input, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './MappingToolbar.module.css';

interface MappingToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  descriptionSuggestions: string[];
  valueOptions: { value: string; label: string }[];
  valuePlaceholder: string;
  onAdd: (description: string, value: string) => Promise<void>;
}

export function MappingToolbar({
  search,
  onSearchChange,
  descriptionSuggestions,
  valueOptions,
  valuePlaceholder,
  onAdd,
}: MappingToolbarProps) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const autoOptions = descriptionSuggestions
    .filter(d => description === '' || d.toLowerCase().includes(description.toLowerCase()))
    .map(d => ({ value: d }));

  async function handleAdd() {
    const desc = description.trim();
    if (!desc || !value) return;
    setSaving(true);
    try {
      await onAdd(desc, value);
      setDescription('');
      setValue(undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.toolbar}>
      <Space.Compact>
        <AutoComplete
          placeholder="Description"
          value={description}
          onChange={setDescription}
          options={autoOptions}
          filterOption={(input, option) =>
            (option?.value as string ?? '').toLowerCase().includes(input.toLowerCase())
          }
          className={styles.description}
        />
        <Select
          placeholder={valuePlaceholder}
          value={value}
          options={valueOptions}
          onChange={setValue}
          showSearch
          optionFilterProp="label"
          className={styles.value}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={saving}
          disabled={!description.trim() || !value}
          onClick={handleAdd}
        >
          Add
        </Button>
      </Space.Compact>

      <Input.Search
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        onSearch={onSearchChange}
        placeholder="Search descriptions..."
        allowClear
        className={styles.search}
      />
    </div>
  );
}
