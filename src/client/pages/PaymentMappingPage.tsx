import { useCallback, useMemo } from 'react';
import { Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { paymentMappingApi } from '../httpClient/client.js';
import { usePaymentMapping } from '../hooks/usePaymentMapping.js';
import { MappingPage } from '../components/MappingPage/MappingPage.js';
import { SuggestedChips } from '../components/SuggestedChips/SuggestedChips.js';
import { MappingSelectCell } from '../components/MappingSelectCell/MappingSelectCell.js';
import type { PaymentMapping } from '../../shared/types.js';

function getPaymentOptions(accountData: PaymentMapping[]): { value: string; label: string }[] {
  const methods = new Set<string>();
  for (const m of accountData) {
    if (m.preferredPaymentMethod) methods.add(m.preferredPaymentMethod);
    for (const s of m.suggestedPaymentMethods) methods.add(s);
  }
  return Array.from(methods).sort().map(m => ({ value: m, label: m }));
}

export function PaymentMappingPage() {
  const { data, isLoading, error, reload } = usePaymentMapping();
  const navigate = useNavigate();

  const navigateToSearch = useCallback((description: string) => {
    navigate('/transactions', { state: { search: description } });
  }, [navigate]);

  const handleSetPreferred = useCallback(async (account: string, description: string, paymentMethod: string) => {
    await paymentMappingApi.setPreferred(account, description, paymentMethod);
    reload();
  }, [reload]);

  const handleDelete = useCallback(async (account: string, description: string) => {
    await paymentMappingApi.delete(account, description);
    reload();
  }, [reload]);

  const tableColumns = useMemo<ColumnsType<PaymentMapping>>(() => [
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
      render: (_: unknown, record: PaymentMapping) => {
        const accountData = data.filter(m => m.account === record.account);
        return (
          <MappingSelectCell
            value={record.preferredPaymentMethod}
            options={getPaymentOptions(accountData)}
            onSave={(pm) => handleSetPreferred(record.account, record.description, pm)}
          />
        );
      },
    },
    {
      title: 'Suggested',
      key: 'suggested',
      render: (_: unknown, record: PaymentMapping) => (
        <SuggestedChips
          items={record.suggestedPaymentMethods.map(m => ({ key: m, label: m }))}
          canRemove={false}
          onSelect={(m) => handleSetPreferred(record.account, record.description, m)}
        />
      ),
    },
    {
      title: '',
      key: 'delete',
      width: 48,
      render: (_: unknown, record: PaymentMapping) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => handleDelete(record.account, record.description)}
        />
      ),
    },
  ], [data, navigateToSearch, handleSetPreferred, handleDelete]);

  return (
    <MappingPage
      title="Payment Mapping"
      data={data}
      isLoading={isLoading}
      error={error}
      onRecalculate={paymentMappingApi.recalculate}
      tableColumns={tableColumns}
      rowClassName={r => r.preferredPaymentMethod === null ? 'mapping-row-no-preferred' : ''}
      getValueOptions={getPaymentOptions}
      valuePlaceholder="Payment method"
      onAdd={async (account, desc, pm) => {
        await paymentMappingApi.setPreferred(account, desc, pm);
        reload();
      }}
    />
  );
}
