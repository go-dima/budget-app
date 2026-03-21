import { useState } from 'react';
import { Button, Card, Tag, Typography, Space, Spin, Flex } from 'antd';
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

        <Flex vertical style={{ width: '100%' }}>
          {[...allCategories]
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
              if (a.excludedByDefault !== b.excludedByDefault) return a.excludedByDefault ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <span dir="rtl">{cat.name}</span>
                <Tag color={cat.type === 'income' ? 'green' : 'red'} style={{ fontSize: 11 }}>
                  {cat.type}
                </Tag>
              </Space>
              <Space.Compact size="small">
                <Button
                  size="small"
                  type={!cat.excludedByDefault ? 'primary' : 'default'}
                  disabled={saving === cat.id}
                  onClick={() => { if (cat.excludedByDefault) handleToggle(cat, false); }}
                >Show</Button>
                <Button
                  size="small"
                  type="default"
                  style={cat.excludedByDefault ? { background: '#8c8c8c', color: '#fff', borderColor: '#8c8c8c' } : {}}
                  disabled={saving === cat.id}
                  onClick={() => { if (!cat.excludedByDefault) handleToggle(cat, true); }}
                >Hide</Button>
              </Space.Compact>
            </div>
          ))}
        </Flex>
      </Card>
    </div>
  );
}
