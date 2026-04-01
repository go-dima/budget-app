import { useMemo, useState } from 'react';
import { Alert, Button, Spin, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageContainer } from '../PageContainer/PageContainer.js';
import { PageHeader } from '../PageHeader/PageHeader.js';
import { AccountTabs } from '../AccountTabs/AccountTabs.js';
import { MappingToolbar } from '../MappingToolbar/MappingToolbar.js';
import type { RecalculateResult } from '../../../shared/types.js';

export interface MappingPageProps<T extends { account: string; description: string }> {
  title: string;
  data: T[];
  isLoading: boolean;
  error: Error | null;
  onRecalculate: () => Promise<RecalculateResult>;
  tableColumns: ColumnsType<T>;
  rowClassName?: (row: T) => string;
  getValueOptions: (accountData: T[]) => { value: string; label: string }[];
  valuePlaceholder: string;
  onAdd: (account: string, description: string, value: string) => Promise<void>;
}

export function MappingPage<T extends { account: string; description: string }>({
  title,
  data,
  isLoading,
  error,
  onRecalculate,
  tableColumns,
  rowClassName,
  getValueOptions,
  valuePlaceholder,
  onAdd,
}: MappingPageProps<T>) {
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState('');

  const accounts = useMemo(
    () => Array.from(new Set(data.map(m => m.account))).sort(),
    [data],
  );

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const result = await onRecalculate();
      message.success(
        `Mapping recalculated: ${result.updated} updated, ${result.conflicts} without preferred, ${result.noops} no-ops`,
      );
    } finally {
      setRecalculating(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Spin style={{ display: 'block', padding: 48 }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Alert type="error" message={error.message} />
      </PageContainer>
    );
  }

  const lowerSearch = search.toLowerCase();

  return (
    <PageContainer>
      <PageHeader title={title}>
        <Button type="default" loading={recalculating} onClick={handleRecalculate}>
          Re-calculate
        </Button>
      </PageHeader>
      <AccountTabs
        accounts={accounts}
        renderContent={(account) => {
          const accountData = data.filter(m => m.account === account);
          const filtered = lowerSearch
            ? accountData.filter(m => m.description.toLowerCase().includes(lowerSearch))
            : accountData;
          return (
            <>
              <MappingToolbar
                search={search}
                onSearchChange={setSearch}
                descriptionSuggestions={accountData.map(m => m.description)}
                valueOptions={getValueOptions(accountData)}
                valuePlaceholder={valuePlaceholder}
                onAdd={(desc, value) => onAdd(account, desc, value)}
              />
              <Table<T>
                columns={tableColumns}
                dataSource={filtered}
                rowKey={r => `${r.account}::${r.description}`}
                locale={{ emptyText: 'No mappings for this account yet.' }}
                pagination={{ pageSize: 20 }}
                rowClassName={rowClassName}
              />
            </>
          );
        }}
      />
    </PageContainer>
  );
}
