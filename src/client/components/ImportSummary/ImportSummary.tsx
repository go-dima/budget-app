import { Button, Result, Table } from 'antd';
import type { ImportExecuteResponse } from '../../../shared/types.js';

interface ImportSummaryProps {
  result: ImportExecuteResponse;
  onGoToOverview: () => void;
  onImportMore: () => void;
}

export function ImportSummary({ result, onGoToOverview, onImportMore }: ImportSummaryProps) {
  const columns = [
    { title: 'Account', dataIndex: 'accountName', key: 'accountName' },
    { title: 'New Transactions', dataIndex: 'newTransactions', key: 'newTransactions' },
    { title: 'Duplicates Skipped', dataIndex: 'duplicatesSkipped', key: 'duplicatesSkipped' },
    { title: 'Error', dataIndex: 'error', key: 'error', render: (v: string | null) => v ?? '—' },
  ];

  const footerData = [{ accountName: 'Total', newTransactions: result.totalNew, duplicatesSkipped: result.totalSkipped, error: null }];

  return (
    <Result
      status={result.success ? 'success' : 'warning'}
      title={result.success ? 'Import Complete' : 'Import Completed with Errors'}
      subTitle={`${result.totalNew} transactions imported, ${result.totalSkipped} duplicates skipped`}
      extra={[
        <Button type="primary" key="overview" onClick={onGoToOverview}>Go to Overview</Button>,
        <Button key="more" onClick={onImportMore}>Import More</Button>,
      ]}
    >
      <Table
        dataSource={[...result.results, ...footerData]}
        columns={columns}
        rowKey={(r, i) => `${r.accountName}-${i}`}
        pagination={false}
        size="small"
      />
    </Result>
  );
}
