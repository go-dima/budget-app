import { useCallback, useEffect, useState } from 'react';
import { message, Tag, Typography, Upload } from 'antd';
import { DatabaseOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { databasesApi, importApi } from '../httpClient/client.js';
import { DbStatusTable } from '../components/DbStatusTable/DbStatusTable.js';
import { ImportPreview } from '../components/ImportPreview/ImportPreview.js';
import { ImportSummary } from '../components/ImportSummary/ImportSummary.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { DbEntry, ImportStatusResponse, ImportPreviewResponse, ImportExecuteResponse } from '../../shared/types.js';

const { Title } = Typography;
const { Dragger } = Upload;

type Step = 'status' | 'preview' | 'importing' | 'summary';

export function ImportPage() {
  const navigate = useNavigate();
  const { refreshAll } = useFilters();
  const [step, setStep] = useState<Step>('status');
  const [status, setStatus] = useState<ImportStatusResponse | null>(null);
  const [activeDb, setActiveDb] = useState<DbEntry | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportExecuteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentFilename, setCurrentFilename] = useState('import.xlsx');

  const loadStatus = useCallback(() => {
    importApi.getStatus().then(setStatus).catch(console.error);
    databasesApi.list().then(dbs => setActiveDb(dbs.find(d => d.isActive) ?? null)).catch(console.error);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleFileSelect(file: File): Promise<false> {
    setCurrentFilename(file.name);
    setIsLoading(true);
    try {
      const data = await importApi.preview(file);
      setPreview(data);
      setStep('preview');
    } catch (e) {
      message.error(`Failed to parse file: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
    return false; // prevent default upload behaviour
  }

  async function handleConfirm(sheetNameOverrides: Record<string, string> = {}, selectedSheets: string[] = []) {
    if (!preview) return;
    setStep('importing');
    setIsLoading(true);
    try {
      const data = await importApi.execute(preview.fileId, currentFilename, sheetNameOverrides, selectedSheets);
      setResult(data);
      setStep('summary');
      loadStatus();
    } catch (e) {
      message.error(`Import failed: ${String(e)}`);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      await importApi.reset();
      setStatus({ accounts: [], totalTransactions: 0 });
      message.success('All data cleared.');
    } catch (e) {
      message.error(`Reset failed: ${String(e)}`);
    } finally {
      setIsResetting(false);
    }
  }

  function handleImportMore() {
    setStep('status');
    setPreview(null);
    setResult(null);
    loadStatus();
  }

  function handleGoToOverview() {
    refreshAll();
    navigate('/');
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Import Data</Title>

      {activeDb && (
        <div style={{ marginBottom: 16 }}>
          <Tag icon={<DatabaseOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 10px' }}>
            {activeDb.name}
          </Tag>
        </div>
      )}

      {/* DB Status — always visible unless showing summary */}
      {step !== 'summary' && (
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Current Database State</Title>
          <DbStatusTable status={status} onReset={handleReset} isResetting={isResetting} />
        </div>
      )}

      {/* Upload — only on status step */}
      {step === 'status' && (
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Upload Excel File</Title>
          <Dragger
            accept=".xlsx,.xls"
            multiple={false}
            beforeUpload={file => handleFileSelect(file)}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag Excel file here to upload</p>
            <p className="ant-upload-hint">Accepts .xlsx and .xls files. Each sheet becomes an account.</p>
          </Dragger>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && preview && (
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Preview</Title>
          <ImportPreview preview={preview} onConfirm={(overrides, sheets) => handleConfirm(overrides, sheets)} isLoading={isLoading} />
        </div>
      )}

      {/* Importing progress */}
      {step === 'importing' && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Typography.Text>Importing...</Typography.Text>
        </div>
      )}

      {/* Summary */}
      {step === 'summary' && result && (
        <ImportSummary
          result={result}
          onGoToOverview={handleGoToOverview}
          onImportMore={handleImportMore}
        />
      )}
    </div>
  );
}
