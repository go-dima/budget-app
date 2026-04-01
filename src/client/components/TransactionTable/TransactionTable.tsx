import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { AutoComplete, Input, Pagination, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table/index.js';
import type { SorterResult } from 'antd/es/table/interface.js';
import type { Category, Transaction, TransactionFilters } from '../../../shared/types.js';
import { amountCol, dateCol, descriptionCol } from '../tableColumns.js';
import { CategorySelect } from '../CategorySelect/CategorySelect.js';
import styles from './TransactionTable.module.css';

const PaymentMethodCell = memo(function PaymentMethodCell({
  row, pmOptions, onPaymentMethodChange,
}: {
  row: Transaction;
  pmOptions: { value: string }[];
  onPaymentMethodChange?: (id: string, paymentMethod: string) => void;
}) {
  const [value, setValue] = useState(row.paymentMethod ?? '');
  useEffect(() => { setValue(row.paymentMethod ?? ''); }, [row.paymentMethod]);
  return (
    <AutoComplete
      value={value}
      options={pmOptions}
      onChange={setValue}
      onBlur={() => onPaymentMethodChange?.(row.id, value)}
      style={{ width: '100%', minWidth: 120 }}
      size="small"
      allowClear
    />
  );
});

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
  initialSearch?: string;
  onCategoryChange?: (id: string, categoryId: string | null) => void;
  onPaymentMethodChange?: (id: string, paymentMethod: string) => void;
}

export function TransactionTable({
  transactions, total, page, pageSize, isLoading,
  allCategories, pageCategoryIds, onPageCategoryChange,
  onPageChange, onSort, onSearch, initialSearch,
  onCategoryChange, onPaymentMethodChange,
}: TransactionTableProps) {
  const [localSearch, setLocalSearch] = useState(initialSearch ?? '');

  // Sync input when search is set externally (e.g. navigating from another page)
  useEffect(() => {
    setLocalSearch(initialSearch ?? '');
  }, [initialSearch]);
  const [categoryInput, setCategoryInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(null);

  const visibleRows = transactions;

  const pmOptions = useMemo(() =>
    [...new Set(transactions.map(t => t.paymentMethod).filter(Boolean))]
      .map(v => ({ value: v! })),
    [transactions],
  );

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
    dateCol<Transaction>({ sorter: true, defaultSortOrder: 'descend' }),
    descriptionCol<Transaction>({ sorter: undefined }),
    {
      title: 'Category', key: 'category', sorter: true, width: 180,
      render: (_: unknown, row: Transaction) => (
        <CategorySelect
          value={row.categoryId ?? null}
          options={allCategories.map(c => ({ value: c.id, label: c.name }))}
          onChange={val => onCategoryChange?.(row.id, val ?? null)}
          onClear={() => onCategoryChange?.(row.id, null)}
        />
      ),
    },
    amountCol<Transaction>({ sorter: true, width: 130, fixed: 'right' }),
    { title: 'Account', dataIndex: 'accountName', key: 'account', sorter: true },
    {
      title: 'Payment', key: 'paymentMethod', width: 140,
      render: (_: unknown, row: Transaction) => (
        <PaymentMethodCell row={row} pmOptions={pmOptions} onPaymentMethodChange={onPaymentMethodChange} />
      ),
    },
  ];

  function handleTableChange(_pagination: TablePaginationConfig, _filters: Record<string, unknown>, sorter: SorterResult<Transaction> | SorterResult<Transaction>[]) {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s?.columnKey) {
      onSort(s.columnKey as TransactionFilters['sortBy'], s.order === 'ascend' ? 'asc' : 'desc');
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
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
          allowClear={{ clearIcon: <span style={{ fontSize: 12, color: '#888' }}>Clear</span> }}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>
      <Table
        dataSource={visibleRows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 700 }}
        pagination={false}
        onChange={handleTableChange}
      />
      <div className={styles.paginationBar}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showTotal={t => `${t} transactions`}
          onChange={(p, ps) => onPageChange(p, ps)}
        />
      </div>
    </div>
  );
}
