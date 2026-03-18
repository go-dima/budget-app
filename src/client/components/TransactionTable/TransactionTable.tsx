import { Input, Table, Tooltip } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table/index.js';
import type { SorterResult } from 'antd/es/table/interface.js';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { Transaction, TransactionFilters } from '../../../shared/types.js';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onSort: (sortBy: TransactionFilters['sortBy'], sortOrder: 'asc' | 'desc') => void;
  onSearch: (search: string) => void;
}

export function TransactionTable({ transactions, total, page, pageSize, isLoading, onPageChange, onSort, onSearch }: TransactionTableProps) {
  const columns: ColumnsType<Transaction> = [
    { title: 'Date', dataIndex: 'date', key: 'date', sorter: true, defaultSortOrder: 'descend', width: 110, fixed: 'left' },
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
      <Input.Search
        placeholder="Search description..."
        onSearch={onSearch}
        onChange={e => !e.target.value && onSearch('')}
        allowClear
        style={{ marginBottom: 16, maxWidth: 400 }}
      />
      <Table
        dataSource={transactions}
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
