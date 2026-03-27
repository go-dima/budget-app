import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Spin, Table, Typography, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { paymentMappingApi } from '../httpClient/client.js';
import { usePaymentMapping } from '../hooks/usePaymentMapping.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import { PageHeader } from '../components/PageHeader/PageHeader.js';
import { AccountTabs } from '../components/AccountTabs/AccountTabs.js';
import { SuggestedChips } from '../components/SuggestedChips/SuggestedChips.js';
import { MappingSelectCell } from '../components/MappingSelectCell/MappingSelectCell.js';
import { MappingToolbar } from '../components/MappingToolbar/MappingToolbar.js';
import type { PaymentMapping } from '../../shared/types.js';

export function PaymentMappingPage() {
  const { data, isLoading, error, reload } = usePaymentMapping();
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState('');
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

  const handleAddRow = useCallback(async (account: string, description: string, paymentMethod: string) => {
    await paymentMappingApi.setPreferred(account, description, paymentMethod);
    reload();
  }, [reload]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const result = await paymentMappingApi.recalculate();
      message.success(`Mapping recalculated: ${result.updated} updated, ${result.conflicts} without preferred, ${result.noops} no-ops`);
      reload();
    } finally {
      setRecalculating(false);
    }
  }

  const accountNames = useMemo(
    () => Array.from(new Set(data.map(m => m.account))).sort(),
    [data],
  );

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
        const options = getPaymentOptions(accountData);
        return (
          <MappingSelectCell
            value={record.preferredPaymentMethod}
            options={options}
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

  if (isLoading) {
    return (
      <PageContainer>
        <Typography.Title level={2}>Payment Mapping</Typography.Title>
        <Spin style={{ display: 'block', padding: 48 }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Typography.Title level={2}>Payment Mapping</Typography.Title>
        <Alert type="error" title={error.message} />
      </PageContainer>
    );
  }

  const lowerSearch = search.toLowerCase();

  return (
    <PageContainer>
      <PageHeader title="Payment Mapping">
        <Button type="default" loading={recalculating} onClick={handleRecalculate}>
          Re-calculate
        </Button>
      </PageHeader>
      <AccountTabs
        accounts={accountNames}
        renderContent={(account) => {
          const accountData = data.filter(m => m.account === account);
          const filtered = lowerSearch
            ? accountData.filter(m => m.description.toLowerCase().includes(lowerSearch))
            : accountData;
          const paymentOptions = getPaymentOptions(accountData);
          return (
            <>
              <MappingToolbar
                search={search}
                onSearchChange={setSearch}
                descriptionSuggestions={accountData.map(m => m.description)}
                valueOptions={paymentOptions}
                valuePlaceholder="Payment method"
                onAdd={(desc, pm) => handleAddRow(account, desc, pm)}
              />
              <Table<PaymentMapping>
                columns={tableColumns}
                dataSource={filtered}
                rowKey={r => `${r.account}::${r.description}`}
                locale={{ emptyText: 'No mappings for this account yet.' }}
                pagination={{ pageSize: 20 }}
                rowClassName={r => r.preferredPaymentMethod === null ? 'mapping-row-no-preferred' : ''}
              />
            </>
          );
        }}
      />
    </PageContainer>
  );
}

function getPaymentOptions(accountData: PaymentMapping[]): { value: string; label: string }[] {
  const methods = new Set<string>();
  for (const m of accountData) {
    if (m.preferredPaymentMethod) methods.add(m.preferredPaymentMethod);
    for (const s of m.suggestedPaymentMethods) methods.add(s);
  }
  return Array.from(methods).sort().map(m => ({ value: m, label: m }));
}
