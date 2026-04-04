import { useMemo, useState } from 'react';
import { Button, Table, Tabs, Tag, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import type { ColumnsType } from 'antd/es/table';
import type { Category, ImportedTransactionReview } from '../../../shared/types.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { SearchableDropdown } from '../SearchableDropdown/SearchableDropdown.js';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import { dateCol as makeDateCol, descriptionColSimple as makeDescCol } from '../tableColumns.js';
import styles from './CategoryReview.module.css';

const { Title, Text } = Typography;

function buildCategoryOptions(
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
    ...(preferred.length > 0 ? [{ label: 'Preferred', options: preferred }] : []),
    ...(suggested.length > 0 ? [{ label: 'Suggested', options: suggested }] : []),
    { label: 'All', options: rest },
  ];
}

interface CategoryReviewProps {
  transactions: ImportedTransactionReview[];
  categories: Category[];
  onSave: (
    categoryOverrides: Record<string, string | null>,
    pmOverrides: Record<string, string>,
    skippedIds: string[],
  ) => void;
  isLoading: boolean;
}

export function CategoryReview({ transactions, categories, onSave, isLoading }: CategoryReviewProps) {
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({});
  const [pmOverrides, setPmOverrides] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [pages, setPages] = useState<Record<string, number>>({});

  function getEffectiveCategoryId(row: ImportedTransactionReview): string | null {
    if (row.id in categoryOverrides) return categoryOverrides[row.id]!;
    return row.categoryId;
  }

  function getEffectiveCategoryName(row: ImportedTransactionReview): string | null {
    if (row.id in categoryOverrides) {
      const id = categoryOverrides[row.id];
      if (!id) return null;
      return categories.find(c => c.id === id)?.name ?? null;
    }
    return row.categoryName;
  }

  function getEffectivePm(row: ImportedTransactionReview): string {
    return pmOverrides[row.id] ?? row.paymentMethod ?? '';
  }

  const groups = useMemo(() => {
    const map = new Map<string, ImportedTransactionReview[]>();
    for (const tx of transactions) {
      if (!map.has(tx.accountName)) map.set(tx.accountName, []);
      map.get(tx.accountName)!.push(tx);
    }
    return Array.from(map.entries());
  }, [transactions]);

  const rowCategoryOptions = useMemo(() => new Map(
    transactions.map(row => [row.id, buildCategoryOptions(row.preferredCategoryId, row.suggestedCategoryIds, categories)])
  ), [transactions, categories]);

  const allCategoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories]);

  const pmSuggestions = useMemo(() => {
    const pmSet = new Set<string>();
    for (const row of transactions) {
      if (row.preferredPaymentMethod) pmSet.add(row.preferredPaymentMethod);
      for (const pm of row.suggestedPaymentMethods) pmSet.add(pm);
      if (row.paymentMethod) pmSet.add(row.paymentMethod);
    }
    return Array.from(pmSet).map(v => ({ value: v, label: v }));
  }, [transactions]);

  function handleSave() {
    onSave(categoryOverrides, pmOverrides, Array.from(skipped));
  }

  function toggleSkip(id: string) {
    setSkipped(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const columns = useMemo<ColumnsType<ImportedTransactionReview>>(() => [
    makeDateCol<ImportedTransactionReview>(),
    makeDescCol<ImportedTransactionReview>(),
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (v: number) => <AmountDisplay amount={v} />,
    },
    {
      title: 'Category',
      key: 'category',
      width: 200,
      render: (_: unknown, row: ImportedTransactionReview) => {
        if (skipped.has(row.id)) return <Text type="secondary">—</Text>;
        const effectiveId = getEffectiveCategoryId(row);
        if (row.autoAssigned && !(row.id in categoryOverrides)) {
          const name = getEffectiveCategoryName(row);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {name ? <Tag color="blue">{name}</Tag> : <Text type="secondary">—</Text>}
              <Button size="small" type="text" onClick={() => setCategoryOverrides(p => ({ ...p, [row.id]: null }))}>✕</Button>
            </div>
          );
        }
        return (
          <SearchableDropdown
            value={effectiveId}
            options={rowCategoryOptions.get(row.id) ?? allCategoryOptions}
            placeholder="Select category"
            onChange={val => setCategoryOverrides(p => ({ ...p, [row.id]: val ?? null }))}
            onClear={() => setCategoryOverrides(p => ({ ...p, [row.id]: null }))}
          />
        );
      },
    },
    {
      title: 'Payment Method',
      key: 'paymentMethod',
      width: 160,
      render: (_: unknown, row: ImportedTransactionReview) => {
        if (skipped.has(row.id)) return <Text type="secondary">—</Text>;
        return (
          <SearchableDropdown
            value={getEffectivePm(row) || undefined}
            options={pmSuggestions}
            allowCreate
            onChange={val => setPmOverrides(p => ({ ...p, [row.id]: val ?? '' }))}
          />
        );
      },
    },
    {
      title: '',
      key: 'skip',
      width: 70,
      render: (_: unknown, row: ImportedTransactionReview) => (
        <Button
          size="small"
          type={skipped.has(row.id) ? 'primary' : 'default'}
          danger={!skipped.has(row.id)}
          onClick={() => toggleSkip(row.id)}
        >
          {skipped.has(row.id) ? 'Undo' : 'Skip'}
        </Button>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [skipped, categoryOverrides, pmOverrides, rowCategoryOptions, allCategoryOptions, pmSuggestions]);

  if (transactions.length === 0) {
    return <EmptyState title="No transactions to review" />;
  }

  const skippedCount = skipped.size;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Review Transactions</Title>
        <Button
          type="primary"
          loading={isLoading}
          onClick={handleSave}
        >
          {skippedCount > 0 ? `Save & Continue (skip ${skippedCount})` : 'Save & Continue'}
        </Button>
      </div>

      <Tabs
        items={groups.map(([account, rows]) => ({
          key: account,
          label: account,
          children: (
            <Table<ImportedTransactionReview>
              dataSource={rows}
              rowKey="id"
              columns={columns}
              size="small"
              pagination={{
                pageSize: 50,
                showSizeChanger: false,
                current: pages[account] ?? 1,
                onChange: p => setPages(prev => ({ ...prev, [account]: p })),
              }}
              rowClassName={row => skipped.has(row.id) ? styles.skipped : ''}
            />
          ),
        }))}
      />
    </div>
  );
}
