import { useMemo, useRef, useState } from 'react';
import { Input, Select, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table/index.js';
import type { SorterResult } from 'antd/es/table/interface.js';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { Category, Transaction, TransactionFilters } from '../../../shared/types.js';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  allCategories: Category[];
  pageCategoryIds: string[];
  onPageCategoryChange: (ids: string[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onSort: (sortBy: TransactionFilters['sortBy'], sortOrder: 'asc' | 'desc') => void;
  onSearch: (search: string) => void;
}

export function TransactionTable({
  transactions, total, page, pageSize, isLoading,
  allCategories, pageCategoryIds, onPageCategoryChange,
  onPageChange, onSort, onSearch,
}: TransactionTableProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(null);

  const visibleRows = localSearch
    ? transactions.filter(t => t.description?.toLowerCase().includes(localSearch.toLowerCase()))
    : transactions;

  // Include ALL categories so the Select can resolve label text for selected IDs.
  // Filter by search text only (not by already-selected) — Select handles that display natively.
  const filteredCategoryOptions = useMemo(() =>
    allCategories
      .filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()))
      .map(c => ({ value: c.id, label: c.name })),
    [allCategories, categoryInput],
  );

  function handleCategoryKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab' && categoryInput.trim()) {
      e.preventDefault();
      const first = filteredCategoryOptions.find(o => !pageCategoryIds.includes(o.value));
      if (first) {
        onPageCategoryChange([...pageCategoryIds, first.value]);
        setCategoryInput('');
      }
    }
    if (e.key === 'Enter') {
      // After the default selection action, move focus away and close the dropdown.
      setTimeout(() => selectRef.current?.blur(), 0);
    }
  }

  const columns: ColumnsType<Transaction> = [
    { title: 'Date', dataIndex: 'date', key: 'date', sorter: true, defaultSortOrder: 'descend' },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      ellipsis: { showTitle: false },
      render: v => <Tooltip title={v}><span dir="rtl">{v}</span></Tooltip>,
    },
    {
      title: 'Category', dataIndex: 'categoryName', key: 'category', sorter: true,
      render: v => v ? <span dir="rtl">{v}</span> : '—',
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', sorter: true, width: 130, fixed: 'right',
      render: v => <AmountDisplay amount={v as number} />,
    },
    { title: 'Account', dataIndex: 'accountName', key: 'account', sorter: true },
    { title: 'Payment', dataIndex: 'paymentMethod', key: 'paymentMethod', render: v => v ?? '—' },
  ];

  function handleTableChange(pagination: TablePaginationConfig, _filters: Record<string, unknown>, sorter: SorterResult<Transaction> | SorterResult<Transaction>[]) {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s?.columnKey) {
      onSort(s.columnKey as TransactionFilters['sortBy'], s.order === 'ascend' ? 'asc' : 'desc');
    }
    if (pagination.current && pagination.pageSize) {
      onPageChange(pagination.current, pagination.pageSize);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          ref={selectRef}
          mode="multiple"
          value={pageCategoryIds}
          onChange={ids => { onPageCategoryChange(ids); setCategoryInput(''); }}
          searchValue={categoryInput}
          onSearch={setCategoryInput}
          options={filteredCategoryOptions}
          filterOption={false}
          onInputKeyDown={handleCategoryKeyDown}
          optionRender={opt => <span dir="rtl">{opt.label as string}</span>}
          tagRender={({ label, closable, onClose }) => (
            <Tag closable={closable} onClose={onClose} color="blue" style={{ marginRight: 4 }}>
              <span dir="rtl">{label as string}</span>
            </Tag>
          )}
          placeholder="Filter by category..."
          style={{ flex: 1, minWidth: 180 }}
          notFoundContent={categoryInput ? 'No matching categories' : null}
        />
        <Input.Search
          placeholder="Search description..."
          value={localSearch}
          onChange={e => {
            setLocalSearch(e.target.value);
            if (!e.target.value) onSearch('');
          }}
          onSearch={value => onSearch(value)}
          allowClear
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>
      <Table
        dataSource={visibleRows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 700 }}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: t => `${t} transactions` }}
        onChange={handleTableChange}
      />
    </div>
  );
}
