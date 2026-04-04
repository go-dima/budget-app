import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { DatePicker, InputNumber, Pagination, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table/index.js';
import type { SorterResult } from 'antd/es/table/interface.js';
import dayjs from 'dayjs';
import type { Category, Transaction, TransactionFilters } from '../../../shared/types.js';
import { amountCol, dateCol, descriptionCol } from '../tableColumns.js';
import { SearchableDropdown } from '../SearchableDropdown/SearchableDropdown.js';
import { MultiSelectFilter } from '../MultiSelectFilter/MultiSelectFilter.js';
import { ToolbarSearch } from '../ToolbarSearch/ToolbarSearch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import styles from './TransactionTable.module.css';

const { RangePicker } = DatePicker;

const PaymentMethodCell = memo(function PaymentMethodCell({
  row, pmOptions, onPaymentMethodChange,
}: {
  row: Transaction;
  pmOptions: { value: string; label: string }[];
  onPaymentMethodChange?: (id: string, paymentMethod: string) => void;
}) {
  const [value, setValue] = useState(row.paymentMethod ?? '');
  useEffect(() => { setValue(row.paymentMethod ?? ''); }, [row.paymentMethod]);
  return (
    <SearchableDropdown
      value={value || undefined}
      options={pmOptions}
      allowCreate
      onChange={val => setValue(val ?? '')}
      onBlur={() => onPaymentMethodChange?.(row.id, value)}
      style={{ minWidth: 120 }}
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
  pageAccountIds?: string[];
  onPageAccountChange?: (ids: string[]) => void;
  accountOptions?: { value: string; label: string }[];
  pageDateRange?: [string, string] | null;
  onPageDateRangeChange?: (range: [string, string] | null) => void;
  pageAmountRange?: { min?: number; max?: number };
  onPageAmountRangeChange?: (range: { min?: number; max?: number }) => void;
  pagePaymentMethods?: string[];
  onPagePaymentMethodsChange?: (vals: string[]) => void;
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
  pageAccountIds, onPageAccountChange, accountOptions,
  pageDateRange, onPageDateRangeChange,
  pageAmountRange, onPageAmountRangeChange,
  pagePaymentMethods, onPagePaymentMethodsChange,
  onPageChange, onSort, onSearch, initialSearch,
  onCategoryChange, onPaymentMethodChange,
}: TransactionTableProps) {
  const [localSearch, setLocalSearch] = useState(initialSearch ?? '');
  const [localAmount, setLocalAmount] = useState({
    min: pageAmountRange?.min != null ? pageAmountRange.min / 100 : undefined as number | undefined,
    max: pageAmountRange?.max != null ? pageAmountRange.max / 100 : undefined as number | undefined,
  });

  // Sync input when search is set externally (e.g. navigating from another page)
  useEffect(() => { setLocalSearch(initialSearch ?? ''); }, [initialSearch]);

  // Apply debounced amount to parent — skip first render to avoid overwriting on mount
  const debouncedAmount = useDebounce(localAmount, 500);
  const amountMounted = useRef(false);
  useEffect(() => {
    if (!amountMounted.current) { amountMounted.current = true; return; }
    onPageAmountRangeChange?.({
      min: debouncedAmount.min != null ? Math.round(debouncedAmount.min * 100) : undefined,
      max: debouncedAmount.max != null ? Math.round(debouncedAmount.max * 100) : undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount]);

  const visibleRows = transactions;

  const pmOptions = useMemo(() =>
    [...new Set(transactions.map(t => t.paymentMethod).filter(Boolean))]
      .map(v => ({ value: v!, label: v! })),
    [transactions],
  );

  const categoryOptions = useMemo(() =>
    allCategories.map(c => ({ value: c.id, label: c.name })),
    [allCategories],
  );

  const columns: ColumnsType<Transaction> = [
    dateCol<Transaction>({ sorter: true, defaultSortOrder: 'descend' }),
    descriptionCol<Transaction>({ sorter: undefined }),
    {
      title: 'Category', key: 'category', sorter: true, width: 180,
      render: (_: unknown, row: Transaction) => (
        <SearchableDropdown
          value={row.categoryId ?? null}
          options={allCategories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className={styles.toolbar}>
        {/* Row 1: Account, Date, Amount */}
        <div className={styles.toolbarRow}>
          {accountOptions && accountOptions.length > 0 && (
            <MultiSelectFilter
              value={pageAccountIds ?? []}
              onChange={ids => onPageAccountChange?.(ids)}
              options={accountOptions}
              placeholder="Account"
              tagColor="geekblue"
              style={{ minWidth: 132, maxWidth: 286 }}
            />
          )}
          <RangePicker
            picker="month"
            value={pageDateRange ? [dayjs(pageDateRange[0]), dayjs(pageDateRange[1])] : null}
            onChange={dates => {
              if (dates?.[0] && dates?.[1]) {
                onPageDateRangeChange?.([
                  dates[0].startOf('month').format('YYYY-MM-DD'),
                  dates[1].endOf('month').format('YYYY-MM-DD'),
                ]);
              } else {
                onPageDateRangeChange?.(null);
              }
            }}
            allowClear
          />
          <Space.Compact>
            <InputNumber
              placeholder="Min ₪"
              min={0}
              value={localAmount.min}
              onChange={val => setLocalAmount(prev => ({ ...prev, min: val ?? undefined }))}
              style={{ width: 90 }}
            />
            <InputNumber
              placeholder="Max ₪"
              min={0}
              value={localAmount.max}
              onChange={val => setLocalAmount(prev => ({ ...prev, max: val ?? undefined }))}
              style={{ width: 90 }}
            />
          </Space.Compact>
        </div>
        {/* Row 2: Category, Payment method, Description search */}
        <div className={styles.toolbarRow}>
          <MultiSelectFilter
            value={pageCategoryIds}
            onChange={onPageCategoryChange}
            options={categoryOptions}
            placeholder="Filter by category..."
            tagColor="blue"
            rtl
          />
          <MultiSelectFilter
            value={pagePaymentMethods ?? []}
            onChange={vals => onPagePaymentMethodsChange?.(vals)}
            options={pmOptions}
            placeholder="Filter by payment..."
            tagColor="purple"
          />
          <ToolbarSearch
            placeholder="Search description..."
            value={localSearch}
            onChange={v => { setLocalSearch(v); onSearch(v); }}
            debounceMs={400}
            style={{ minWidth: 200 }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          dataSource={visibleRows}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 700 }}
          pagination={false}
          onChange={handleTableChange}
          rowClassName={(record: Transaction) => {
            const [year, month] = record.date.split('-').map(Number);
            return (year * 12 + month) % 2 === 0 ? styles.monthAlt : '';
          }}
        />
      </div>
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

