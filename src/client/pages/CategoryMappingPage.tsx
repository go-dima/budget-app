import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Button, Select, Spin, Table, Tabs, Tag, Typography, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { categoryMappingApi } from '../httpClient/client.js';
import { useCategoryMapping } from '../hooks/useCategoryMapping.js';
import { useCategories } from '../hooks/useCategories.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import type { CategoryMapping, Category } from '../../shared/types.js';
import styles from './CategoryMappingPage.module.css';

const { Title, Text } = Typography;

// ── Click-to-edit category cell ──────────────────────────────────────────────
// The Select is only mounted while this specific cell is in edit mode, avoiding
// N simultaneous rc-select instances that trigger Ant Design's useControlledState
// useLayoutEffect loop.

interface CategoryCellProps {
  categoryId: string | null;
  categoryName: string | undefined;
  options: { value: string; label: string }[];
  onSave: (categoryId: string) => void;
}

const CategoryCell = memo(function CategoryCell({ categoryId, categoryName, options, onSave }: CategoryCellProps) {
  const [editing, setEditing] = useState(false);
  const committedRef = useRef(false);

  if (editing) {
    return (
      <Select
        autoFocus
        showSearch
        defaultOpen
        className={styles.categorySelectCell}
        value={categoryId ?? undefined}
        options={options}
        optionFilterProp="label"
        onChange={(val: string) => { committedRef.current = true; onSave(val); setEditing(false); }}
        onBlur={() => { if (!committedRef.current) setEditing(false); committedRef.current = false; }}
      />
    );
  }

  if (categoryId === null) {
    return (
      <span
        className={styles.clickableCell}
        onClick={() => setEditing(true)}
      >
        <Text type="warning" italic>None — choose one</Text>
      </span>
    );
  }

  return (
    <span
      dir="rtl"
      className={styles.clickableCell}
      onClick={() => setEditing(true)}
    >
      {categoryName ?? '—'}
    </span>
  );
});

// ── Suggested chips ───────────────────────────────────────────────────────────

interface SuggestedChipsProps {
  suggestedCategories: Category[];
  onRemove: (id: string) => void;
  onSetPreferred: (id: string) => void;
}

const SuggestedChips = memo(function SuggestedChips({ suggestedCategories, onRemove, onSetPreferred }: SuggestedChipsProps) {
  if (suggestedCategories.length === 0) return <Text type="secondary">—</Text>;
  return (
    <span>
      {suggestedCategories.map(c => (
        <Tag
          key={c.id}
          closable
          onClose={() => onRemove(c.id)}
          style={{ cursor: 'pointer' }}
          onClick={() => onSetPreferred(c.id)}
        >
          {c.name}
        </Tag>
      ))}
    </span>
  );
});

// ── Page ─────────────────────────────────────────────────────────────────────

export function CategoryMappingPage() {
  const { data, isLoading, error, reload } = useCategoryMapping();
  const { data: categories } = useCategories();
  const [recalculating, setRecalculating] = useState(false);
  const navigate = useNavigate();

  const navigateToSearch = useCallback((description: string) => {
    navigate('/transactions', { state: { search: description } });
  }, [navigate]);

  const categoryOptions = useMemo(
    () => categories.map((c: Category) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const handleSetPreferred = useCallback(async (account: string, description: string, categoryId: string) => {
    await categoryMappingApi.setPreferred(account, description, categoryId);
    reload();
  }, [reload]);

  const handleRemoveSuggested = useCallback(async (account: string, description: string, categoryId: string) => {
    await categoryMappingApi.removeSuggested(account, description, categoryId);
    reload();
  }, [reload]);

  const handleDelete = useCallback(async (account: string, description: string) => {
    await categoryMappingApi.delete(account, description);
    reload();
  }, [reload]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const result = await categoryMappingApi.recalculate();
      message.success(`Mapping recalculated: ${result.updated} updated, ${result.conflicts} without preferred, ${result.noops} no-ops`);
      reload();
    } finally {
      setRecalculating(false);
    }
  }

  const tableColumns = useMemo<ColumnsType<CategoryMapping>>(() => [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val: string) => (
        <Typography.Link onClick={() => navigateToSearch(val)} className="rtl-block">
          {val}
        </Typography.Link>
      ),
    },
    {
      title: 'Preferred',
      key: 'preferred',
      render: (_: unknown, record: CategoryMapping) => (
        <CategoryCell
          categoryId={record.preferredCategoryId}
          categoryName={record.preferredCategory?.name}
          options={categoryOptions}
          onSave={(catId) => handleSetPreferred(record.account, record.description, catId)}
        />
      ),
    },
    {
      title: 'Suggested',
      key: 'suggested',
      render: (_: unknown, record: CategoryMapping) => (
        <SuggestedChips
          suggestedCategories={record.suggestedCategories ?? []}
          onRemove={(catId) => handleRemoveSuggested(record.account, record.description, catId)}
          onSetPreferred={(catId) => handleSetPreferred(record.account, record.description, catId)}
        />
      ),
    },
    {
      title: '',
      key: 'delete',
      width: 48,
      render: (_: unknown, record: CategoryMapping) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => handleDelete(record.account, record.description)}
        />
      ),
    },
  ], [categoryOptions, navigateToSearch, handleSetPreferred, handleRemoveSuggested, handleDelete]);

  if (isLoading) {
    return (
      <PageContainer>
        <Title level={2}>Category Mapping</Title>
        <Spin style={{ display: 'block', padding: 48 }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Title level={2}>Category Mapping</Title>
        <Alert type="error" title={error.message} />
      </PageContainer>
    );
  }

  const accounts = Array.from(new Set(data.map(m => m.account))).sort();

  function renderAccountContent(account: string) {
    const accountData = data.filter(m => m.account === account);
    return (
      <Table<CategoryMapping>
        columns={tableColumns}
        dataSource={accountData}
        rowKey={r => `${r.account}::${r.description}`}
        locale={{ emptyText: 'No mappings for this account yet.' }}
        pagination={{ pageSize: 20 }}
        rowClassName={r => r.preferredCategoryId === null ? 'mapping-row-no-preferred' : ''}
      />
    );
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <Title level={2} style={{ margin: 0 }}>Category Mapping</Title>
        <Button
          type="default"
          loading={recalculating}
          onClick={handleRecalculate}
        >
          Re-calculate
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Typography.Text type="secondary">
          No mappings yet. Import some transactions and click Re-calculate.
        </Typography.Text>
      ) : (
        <Tabs
          items={accounts.map(account => ({
            key: account,
            label: account,
            children: renderAccountContent(account),
          }))}
        />
      )}
    </PageContainer>
  );
}
