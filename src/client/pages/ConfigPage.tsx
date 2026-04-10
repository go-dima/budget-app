import { useState } from 'react';
import { Button, Card, Tag, Typography, Space, Spin, Flex } from 'antd';
import { categoriesApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import type { Category } from '../../shared/types.js';
import styles from './ConfigPage.module.css';

const { Title, Text } = Typography;

export function ConfigPage() {
  const { allCategories, categoriesLoaded, refreshCategoriesData } = useFilters();
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

  if (!categoriesLoaded) {
    return (
      <PageContainer maxWidth={600}>
        <Title level={2}>Config</Title>
        <Card title="Default Hidden Categories">
          <Spin className="centered-spin" />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={600}>
      <Title level={2}>Config</Title>

      <Card title="Default Hidden Categories">
        <Text type="secondary" className={styles.descriptionText}>
          Categories toggled on below are hidden from all views by default.
          Uncheck them in the filter sidebar to temporarily reveal them.
        </Text>

        <Flex vertical className="full-width">
          {[...allCategories]
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
              if (a.excludedByDefault !== b.excludedByDefault) return a.excludedByDefault ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map(cat => (
            <div key={cat.id} className={styles.categoryRow}>
              <Space>
                <span dir="rtl">{cat.name}</span>
                <Tag color={cat.type === 'income' ? 'green' : 'red'} className="text-xs">
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
                  className={cat.excludedByDefault ? styles.hideActiveBtn : undefined}
                  disabled={saving === cat.id}
                  onClick={() => { if (!cat.excludedByDefault) handleToggle(cat, true); }}
                >Hide</Button>
              </Space.Compact>
            </div>
          ))}
        </Flex>
      </Card>
    </PageContainer>
  );
}
