import { useEffect, useMemo } from 'react';
import { Tag, Typography, Upload } from 'antd';
import { DatabaseOutlined, InboxOutlined } from '@ant-design/icons';
import { DbStatusTable } from '../components/DbStatusTable/DbStatusTable.js';
import { ImportPreview } from '../components/ImportPreview/ImportPreview.js';
import { ImportSummary } from '../components/ImportSummary/ImportSummary.js';
import { CategoryReview } from '../components/CategoryReview/CategoryReview.js';
import { ColumnMappingStep } from '../components/ColumnMappingStep/ColumnMappingStep.js';
import { HeaderRowSelector } from '../components/HeaderRowSelector/HeaderRowSelector.js';
import { EmptyState } from '../components/EmptyState/EmptyState.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import { useCategories } from '../hooks/useCategories.js';
import { useImportFlow } from '../hooks/useImportFlow.js';

const { Title } = Typography;
const { Dragger } = Upload;

export function ImportPage() {
  const {
    step, status, activeDb, preview, skippedSheets, pendingAccountOverrides, result, reviewTransactions,
    isLoading, isResetting,
    handleFileSelect, handleHeaderSelectionConfirm, handleConfirm, handleColumnMappingConfirm,
    handleReviewComplete, handleReset, handleImportMore, handleGoToOverview,
  } = useImportFlow();

  const { data: categories, reload: reloadCategories } = useCategories();

  // Reload categories after import — import may have created new ones
  useEffect(() => {
    if (step === 'review') reloadCategories();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive existing account names from DB status
  const availableAccounts = useMemo(
    () => status?.accounts.map(a => a.accountName) ?? [],
    [status]
  );

  // All valid sheets for the column mapping step (sheets with no data or skipped are excluded)
  const columnMappingSheets = useMemo(
    () => (preview?.sheets ?? [])
      .filter(s => !s.error && s.rowCount > 0 && !skippedSheets.includes(s.sheetName))
      .map(s => ({
        sheetName: s.sheetName,
        unknownColumns: s.unknownColumns ?? [],
        storedMapping: s.storedColumnMapping ?? null,
      })),
    [preview, skippedSheets]
  );

  return (
    <PageContainer maxWidth={800}>
      <Title level={2}>Import Data</Title>

      {activeDb && (
        <div className="mb-16">
          <Tag icon={<DatabaseOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 10px' }}>
            {activeDb.name}
          </Tag>
        </div>
      )}

      {/* DB Status — always visible unless showing summary, review, or column mapping */}
      {step !== 'summary' && step !== 'review' && step !== 'columnMapping' && step !== 'headerSelection' && (
        <div className="mb-24">
          <Title level={4}>Current Database State</Title>
          <DbStatusTable status={status} onReset={handleReset} isResetting={isResetting} />
        </div>
      )}

      {/* Upload — only on status step */}
      {step === 'status' && (
        <div className="mb-24">
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

      {/* Header Row Selection — for files with rows before the header */}
      {step === 'headerSelection' && preview && (
        <div className="mb-24">
          <Title level={4}>Select Header Row</Title>
          <HeaderRowSelector
            sheets={preview.sheets.filter(s => s.rawRows != null)}
            onConfirm={handleHeaderSelectionConfirm}
          />
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && preview && (
        <div className="mb-24">
          <Title level={4}>Preview</Title>
          <ImportPreview
            preview={{ ...preview, sheets: preview.sheets.filter(s => !skippedSheets.includes(s.sheetName)) }}
            availableAccounts={availableAccounts}
            initialNameOverrides={Object.keys(pendingAccountOverrides).length > 0 ? pendingAccountOverrides : undefined}
            onConfirm={(overrides, sheets, fixBidi) => handleConfirm(overrides, sheets, undefined, fixBidi)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Column Mapping — for files with unrecognised columns; shows all valid sheets */}
      {step === 'columnMapping' && preview && (
        <div className="mb-24">
          <Title level={4}>Map Columns &amp; Assign Accounts</Title>
          <ColumnMappingStep
            sheets={columnMappingSheets}
            availableAccounts={availableAccounts}
            onConfirm={handleColumnMappingConfirm}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Importing progress */}
      {step === 'importing' && (
        <EmptyState title="Importing..." />
      )}

      {/* Transaction Review */}
      {step === 'review' && (
        <div className="mb-24">
          <CategoryReview
            transactions={reviewTransactions}
            categories={categories}
            onSave={handleReviewComplete}
            isLoading={isLoading}
          />
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
    </PageContainer>
  );
}
