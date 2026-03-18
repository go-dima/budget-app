import { useState } from 'react';
import { Card, Switch, Tag, Typography, Space, Spin } from 'antd';
import { categoriesApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { Category } from '../../shared/types.js';

const { Title, Text } = Typography;

export function ConfigPage() {
  const { allCategories, refreshCategoriesData } = useFilters();
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(category: Category, excluded: boolean) {
    setSaving(category.id);
    try {
      await categoriesApi.setExcluded(category.id, excluded);
      refreshCategoriesData();
    } finally {
      setSaving(null);
    }
  }

  if (allCategories.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={2}>Config</Title>
        <Card title="Default Hidden Categories">
          <Spin style={{ display: 'block', padding: 48 }} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={2}>Config</Title>

      <Card title="Default Hidden Categories">
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Categories toggled on below are hidden from all views by default.
          Uncheck them in the filter sidebar to temporarily reveal them.
        </Text>

        <Space direction="vertical" style={{ width: '100%' }}>
          {allCategories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <span dir="rtl">{cat.name}</span>
                <Tag color={cat.type === 'income' ? 'green' : 'red'} style={{ fontSize: 11 }}>
                  {cat.type}
                </Tag>
              </Space>
              <Switch
                checked={cat.excludedByDefault}
                loading={saving === cat.id}
                onChange={checked => handleToggle(cat, checked)}
                checkedChildren="Hidden"
                unCheckedChildren="Visible"
              />
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
}
