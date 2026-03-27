import { Button, Popconfirm, Table, Typography } from 'antd';
import type { ImportStatusResponse } from '../../../shared/types.js';

const { Text } = Typography;

interface DbStatusTableProps {
  status: ImportStatusResponse | null;
  onReset: () => void;
  isResetting?: boolean;
  readOnly?: boolean;
}

export function DbStatusTable({ status, onReset, isResetting, readOnly }: DbStatusTableProps) {
  if (!status || status.totalTransactions === 0) {
    return <Text type="secondary">No data yet. Upload an Excel file to get started.</Text>;
  }

  const columns = [
    { title: 'Account', dataIndex: 'accountName', key: 'accountName' },
    { title: 'Transactions', dataIndex: 'transactionCount', key: 'transactionCount' },
    { title: 'Latest Transaction Date', dataIndex: 'latestDate', key: 'latestDate', render: (v: string | null) => v ?? '—' },
  ];

  const dataSource = [
    ...status.accounts,
    { accountId: 'total', accountName: 'Total', transactionCount: status.totalTransactions, latestDate: null },
  ];

  return (
    <div>
      <Table dataSource={dataSource} columns={columns} rowKey="accountId" pagination={false} size="small" className="mb-12" />
      {!readOnly && (
        <>
          <Text type="secondary" className="mb-8" style={{ display: 'block' }}>
            Importing will add new transactions. Duplicates (same date, amount, description, reference) are skipped automatically.
          </Text>
          <Popconfirm
            title={`This will delete all ${status.totalTransactions} transactions. Are you sure?`}
            onConfirm={onReset}
            okText="Yes, clear all"
            cancelText="Cancel"
          >
            <Button danger loading={isResetting}>Clear all data and re-import</Button>
          </Popconfirm>
        </>
      )}
    </div>
  );
}
