import { useCallback, useMemo } from 'react';
import { Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { categoryMappingApi } from '../httpClient/client.js';
import { useCategoryMapping } from '../hooks/useCategoryMapping.js';
import { useCategories } from '../hooks/useCategories.js';
import { MappingPage } from '../components/MappingPage/MappingPage.js';
import { SuggestedChips } from '../components/SuggestedChips/SuggestedChips.js';
import { MappingSelectCell } from '../components/MappingSelectCell/MappingSelectCell.js';
import type { CategoryMapping, Category } from '../../shared/types.js';

export function CategoryMappingPage() {
  const { data, isLoading, error, reload } = useCategoryMapping();
  const { data: categories } = useCategories();
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
        <MappingSelectCell
          value={record.preferredCategoryId}
          valueLabel={record.preferredCategory?.name}
          options={categoryOptions}
          onSave={(catId) => handleSetPreferred(record.account, record.description, catId)}
          dir="rtl"
        />
      ),
    },
    {
      title: 'Suggested',
      key: 'suggested',
      render: (_: unknown, record: CategoryMapping) => (
        <SuggestedChips
          items={(record.suggestedCategories ?? []).map(c => ({ key: c.id, label: c.name }))}
          canRemove
          onSelect={(id) => handleSetPreferred(record.account, record.description, id)}
          onRemove={(id) => handleRemoveSuggested(record.account, record.description, id)}
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

  return (
    <MappingPage
      title="Category Mapping"
      data={data}
      isLoading={isLoading}
      error={error}
      onRecalculate={categoryMappingApi.recalculate}
      onReloadData={reload}
      tableColumns={tableColumns}
      rowClassName={r => r.preferredCategoryId === null ? 'mapping-row-no-preferred' : ''}
      getValueOptions={() => categoryOptions}
      valuePlaceholder="Category"
      onAdd={async (account, desc, catId) => {
        await categoryMappingApi.setPreferred(account, desc, catId);
        reload();
      }}
    />
  );
}
