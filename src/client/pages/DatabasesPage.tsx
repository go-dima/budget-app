import { useCallback, useEffect, useState } from 'react';
import { message, Typography } from 'antd';
import { databasesApi, importApi } from '../httpClient/client.js';
import { DbPicker } from '../components/DbPicker/DbPicker.js';
import { DbStatusTable } from '../components/DbStatusTable/DbStatusTable.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { ImportStatusResponse } from '../../shared/types.js';

const { Title } = Typography;

export function DatabasesPage() {
  const { refreshAll } = useFilters();
  const [status, setStatus] = useState<ImportStatusResponse | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [viewingFilename, setViewingFilename] = useState<string | undefined>(undefined);
  const [isActiveViewing, setIsActiveViewing] = useState(true);

  const loadStatus = useCallback((filename?: string) => {
    importApi.getStatus(filename).then(setStatus).catch(console.error);
  }, []);

  // On mount, find the active DB and default to viewing it
  useEffect(() => {
    databasesApi.list().then(dbs => {
      const active = dbs.find(d => d.isActive);
      if (active) {
        setViewingFilename(active.filename);
        setIsActiveViewing(true);
        loadStatus(active.filename);
      } else {
        loadStatus();
      }
    }).catch(console.error);
  }, [loadStatus]);

  function handleView(filename: string) {
    setViewingFilename(filename);
    // We'll learn isActive from the DB list (already loaded in DbPicker)
    // Re-fetch to determine if it's active
    databasesApi.list().then(dbs => {
      const db = dbs.find(d => d.filename === filename);
      setIsActiveViewing(db?.isActive ?? false);
    }).catch(console.error);
    loadStatus(filename);
  }

  function handleSwitched() {
    refreshAll();
    // After switching, the new active DB is now the viewed one
    databasesApi.list().then(dbs => {
      const active = dbs.find(d => d.isActive);
      if (active) {
        setViewingFilename(active.filename);
        setIsActiveViewing(true);
        loadStatus(active.filename);
      }
    }).catch(console.error);
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      await importApi.reset();
      setStatus({ accounts: [], totalTransactions: 0 });
      refreshAll();
      message.success('All data cleared.');
    } catch (e) {
      message.error(`Reset failed: ${String(e)}`);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <PageContainer maxWidth={700}>
      <Title level={3}>Databases</Title>
      <DbPicker
        onSwitched={handleSwitched}
        viewingFilename={viewingFilename}
        onView={handleView}
      />
      <Title level={4}>
        {viewingFilename ? 'Database State' : 'Current Database State'}
      </Title>
      <DbStatusTable
        status={status}
        onReset={handleReset}
        isResetting={isResetting}
        readOnly={!isActiveViewing}
      />
    </PageContainer>
  );
}
