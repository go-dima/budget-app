import { Tag, Typography, Upload } from 'antd';
import { DatabaseOutlined, InboxOutlined } from '@ant-design/icons';
import { DbStatusTable } from '../components/DbStatusTable/DbStatusTable.js';
import { ImportPreview } from '../components/ImportPreview/ImportPreview.js';
import { ImportSummary } from '../components/ImportSummary/ImportSummary.js';
import { CategoryReview } from '../components/CategoryReview/CategoryReview.js';
import { EmptyState } from '../components/EmptyState/EmptyState.js';
import { PageContainer } from '../components/PageContainer/PageContainer.js';
import { useCategories } from '../hooks/useCategories.js';
import { useImportFlow } from '../hooks/useImportFlow.js';

const { Title } = Typography;
const { Dragger } = Upload;

export function ImportPage() {
  const {
    step, status, activeDb, preview, result, reviewTransactions,
    isLoading, isResetting, currentFilename,
    handleFileSelect, handleConfirm, handleReviewComplete,
    handleReset, handleImportMore, handleGoToOverview,
  } = useImportFlow();

  const { data: categories } = useCategories();

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

      {/* DB Status — always visible unless showing summary or review */}
      {step !== 'summary' && step !== 'review' && (
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

      {/* Preview */}
      {step === 'preview' && preview && (
        <div className="mb-24">
          <Title level={4}>Preview</Title>
          <ImportPreview preview={preview} onConfirm={(overrides, sheets) => handleConfirm(overrides, sheets)} isLoading={isLoading} />
        </div>
      )}

      {/* Importing progress */}
      {step === 'importing' && (
        <EmptyState title="Importing..." />
      )}

      {/* Category Review */}
      {step === 'review' && (
        <div className="mb-24">
          <Title level={4}>Review Categories</Title>
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
