import { useMemo, useState } from 'react';
import { Button, Table, Tag, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import type { ColumnsType } from 'antd/es/table';
import type { Category, ImportedTransactionReview } from '../../../shared/types.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { CategorySelect } from '../CategorySelect/CategorySelect.js';
import { dateCol as makeDateCol, descriptionColSimple as makeDescCol, amountCol as makeAmountCol } from '../tableColumns.js';
import styles from './CategoryReview.module.css';

const { Title, Text } = Typography;

type FlatOption = { value: string; label: string };
type GroupedOption = { label: string; options: FlatOption[] };

function buildOptions(
  preferredCategoryId: string | null,
  suggestedCategoryIds: string[],
  allCategories: Category[],
): DefaultOptionType[] {
  const usedIds = new Set([
    ...(preferredCategoryId ? [preferredCategoryId] : []),
    ...suggestedCategoryIds,
  ]);

  const preferred: DefaultOptionType[] = preferredCategoryId
    ? [{ value: preferredCategoryId, label: allCategories.find(c => c.id === preferredCategoryId)?.name ?? preferredCategoryId }]
    : [];
  const suggested: DefaultOptionType[] = suggestedCategoryIds
    .map(id => ({ value: id, label: allCategories.find(c => c.id === id)?.name ?? id }));
  const rest: DefaultOptionType[] = allCategories
    .filter(c => !usedIds.has(c.id))
    .map(c => ({ value: c.id, label: c.name }));

  if (preferred.length === 0 && suggested.length === 0) return rest;

  return [
    ...(preferred.length > 0 ? [{ label: 'Preferred', options: preferred } as GroupedOption] : []),
    ...(suggested.length > 0 ? [{ label: 'Suggested', options: suggested } as GroupedOption] : []),
    { label: 'All', options: rest } as GroupedOption,
  ];
}

interface CategoryReviewProps {
  transactions: ImportedTransactionReview[];
  categories: Category[];
  onSave: (overrides: Record<string, string | null>) => void;
  isLoading: boolean;
}

export function CategoryReview({ transactions, categories, onSave, isLoading }: CategoryReviewProps) {
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});

  const categoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories]);

  function getEffectiveCategoryId(row: ImportedTransactionReview): string | null {
    if (row.id in overrides) return overrides[row.id];
    return row.categoryId;
  }

  function getEffectiveCategoryName(row: ImportedTransactionReview): string | null {
    if (row.id in overrides) {
      const id = overrides[row.id];
      if (id === null) return null;
      return categories.find(c => c.id === id)?.name ?? null;
    }
    return row.categoryName;
  }

  function handleClear(id: string) {
    setOverrides(prev => ({ ...prev, [id]: null }));
  }

  function handleAssign(id: string, categoryId: string | null) {
    setOverrides(prev => ({ ...prev, [id]: categoryId }));
  }

  // Memoized per-row grouped options for ALL rows (stable references to avoid rc-select loop).
  // Covers both uncategorized rows (always show Select) and auto-categorized rows that the user clears.
  const rowOptions = useMemo(() => {
    return new Map(
      transactions.map(row => [
        row.id,
        buildOptions(row.preferredCategoryId, row.suggestedCategoryIds, categories),
      ])
    );
  }, [transactions, categories]);

  // Split is based on the initial autoAssigned flag from props so rows don't jump
  // between sections as the user makes category overrides.
  const autoCategorized = transactions.filter(row => row.autoAssigned);
  const uncategorized = transactions.filter(row => !row.autoAssigned);

  const dateColDef = makeDateCol<ImportedTransactionReview>();
  const descColDef = makeDescCol<ImportedTransactionReview>();
  const amountColDef = makeAmountCol<ImportedTransactionReview>();

  const autoCategoryCol: ColumnsType<ImportedTransactionReview>[number] = {
    title: 'Category',
    key: 'category',
    width: 200,
    render: (_: unknown, row: ImportedTransactionReview) => {
      const effectiveId = getEffectiveCategoryId(row);
      // If cleared by the user, show a Select so they can re-assign
      if (row.id in overrides && effectiveId === null) {
        return (
          <CategorySelect
            value={undefined}
            options={rowOptions.get(row.id) ?? categoryOptions}
            onChange={(val) => handleAssign(row.id, val ?? null)}
          />
        );
      }
      const name = getEffectiveCategoryName(row);
      return name ? <Tag color="blue">{name}</Tag> : <Text type="secondary">—</Text>;
    },
  };

  const clearCol: ColumnsType<ImportedTransactionReview>[number] = {
    title: '',
    key: 'clear',
    width: 80,
    render: (_: unknown, row: ImportedTransactionReview) => {
      const effectiveId = getEffectiveCategoryId(row);
      if (effectiveId === null) return null;
      return <Button size="small" onClick={() => handleClear(row.id)}>Clear</Button>;
    },
  };

  const uncatCategoryCol: ColumnsType<ImportedTransactionReview>[number] = {
    title: 'Category',
    key: 'category',
    width: 200,
    render: (_: unknown, row: ImportedTransactionReview) => {
      const effectiveId = getEffectiveCategoryId(row);
      return (
        <CategorySelect
          value={effectiveId}
          options={rowOptions.get(row.id) ?? categoryOptions}
          onChange={(val) => handleAssign(row.id, val ?? null)}
          onClear={() => handleClear(row.id)}
        />
      );
    },
  };

  if (transactions.length === 0) {
    return <EmptyState title="No transactions to review" />;
  }

  return (
    <div>
      {autoCategorized.length > 0 && (
        <div className={styles.section}>
          <Title level={5}>Auto-categorized ({autoCategorized.length})</Title>
          <Table<ImportedTransactionReview>
            dataSource={autoCategorized}
            rowKey="id"
            columns={[dateColDef, descColDef, amountColDef, autoCategoryCol, clearCol]}
            pagination={false}
            size="small"
          />
        </div>
      )}

      {uncategorized.length > 0 && (
        <div className={styles.section}>
          <Title level={5}>Uncategorized ({uncategorized.length})</Title>
          <Table<ImportedTransactionReview>
            dataSource={uncategorized}
            rowKey="id"
            columns={[dateColDef, descColDef, amountColDef, uncatCategoryCol]}
            pagination={false}
            size="small"
          />
        </div>
      )}

      <div className={styles.saveRow}>
        <Button
          type="primary"
          loading={isLoading}
          onClick={() => onSave(overrides)}
        >
          Save &amp; Continue
        </Button>
      </div>
    </div>
  );
}
