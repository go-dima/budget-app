import { useCallback, useMemo } from 'react';
import { Alert, Button, Spin } from 'antd';
import { Typography } from 'antd';
import { columnMappingApi } from '../httpClient/client.js';
import { useColumnMapping } from '../hooks/useColumnMapping.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import { PageHeader } from '../components/PageHeader/PageHeader.js';
import { AccountTabs } from '../components/AccountTabs/AccountTabs.js';
import { MappingTable } from '../components/MappingTable/MappingTable.js';
import type { ColumnMappingTarget } from '../../shared/types.js';

export function ColumnMappingSettingsPage() {
  const { data, isLoading, error, reload } = useColumnMapping();

  const accounts = useMemo(() => Object.keys(data).sort(), [data]);

  const handleSave = useCallback(async (account: string, sourceColumn: string, targetField: ColumnMappingTarget) => {
    const updated = (data[account] ?? []).map(e =>
      e.sourceColumn === sourceColumn ? { ...e, targetField } : e,
    );
    await columnMappingApi.save(account, updated);
    reload();
  }, [data, reload]);

  const handleDeleteRow = useCallback(async (account: string, sourceColumn: string) => {
    const updated = (data[account] ?? []).filter(e => e.sourceColumn !== sourceColumn);
    await columnMappingApi.save(account, updated);
    reload();
  }, [data, reload]);

  const handleDeleteAccount = useCallback(async (account: string) => {
    await columnMappingApi.delete(account);
    reload();
  }, [reload]);

  if (isLoading) {
    return (
      <PageContainer>
        <Typography.Title level={2}>Column Mapping</Typography.Title>
        <Spin style={{ display: 'block', padding: 48 }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Typography.Title level={2}>Column Mapping</Typography.Title>
        <Alert type="error" message={error.message} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Column Mapping" />
      <AccountTabs
        accounts={accounts}
        emptyText="No column mappings stored yet. Import a file with non-standard column names to create mappings automatically."
        renderContent={(account) => {
          const rows = (data[account] ?? []).map(e => ({
            key: e.sourceColumn,
            sourceColumn: e.sourceColumn,
            targetField: e.targetField,
          }));
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <Button danger onClick={() => handleDeleteAccount(account)}>
                  Delete mapping for {account}
                </Button>
              </div>
              <MappingTable
                rows={rows}
                onSave={(col, target) => handleSave(account, col, target)}
                onDelete={(col) => handleDeleteRow(account, col)}
              />
            </>
          );
        }}
      />
    </PageContainer>
  );
}
