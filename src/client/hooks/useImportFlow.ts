import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { databasesApi, importApi, transactionsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { DbEntry, ImportStatusResponse, ImportPreviewResponse, ImportExecuteResponse, ImportedTransactionReview, ColumnMappingMap } from '../../shared/types.js';

type Step = 'status' | 'headerSelection' | 'preview' | 'columnMapping' | 'importing' | 'review' | 'summary';

export function useImportFlow() {
  const navigate = useNavigate();
  const { refreshAll } = useFilters();
  const [step, setStep] = useState<Step>('status');
  const [status, setStatus] = useState<ImportStatusResponse | null>(null);
  const [activeDb, setActiveDb] = useState<DbEntry | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportExecuteResponse | null>(null);
  const [reviewTransactions, setReviewTransactions] = useState<ImportedTransactionReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentFilename, setCurrentFilename] = useState('import.xlsx');
  // header row overrides set by HeaderRowSelector (sheetName → 0-based row index)
  const [headerRowOverrides, setHeaderRowOverrides] = useState<Record<string, number>>({});

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
      setHeaderRowOverrides({});  // reset on new file
      const needsHeaderSelection = data.sheets.some(s => s.detectedHeaderRow > 0);
      const needsColumnMapping = data.sheets.some(s => (s.unknownColumns ?? []).length > 0);
      if (needsHeaderSelection) setStep('headerSelection');
      else if (needsColumnMapping) setStep('columnMapping');
      else setStep('preview');
    } catch (e) {
      message.error(`Failed to parse file: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
    return false; // prevent default upload behaviour
  }

  function handleHeaderSelectionConfirm(overrides: Record<string, number>) {
    setHeaderRowOverrides(overrides);
    if (!preview) return;
    const needsColumnMapping = preview.sheets.some(s => (s.unknownColumns ?? []).length > 0);
    setStep(needsColumnMapping ? 'columnMapping' : 'preview');
  }

  async function handleConfirm(sheetNameOverrides: Record<string, string> = {}, selectedSheets: string[] = [], columnMapping?: ColumnMappingMap) {
    if (!preview) return;
    setStep('importing');
    setIsLoading(true);
    try {
      const data = await importApi.execute(preview.fileId, currentFilename, sheetNameOverrides, selectedSheets, columnMapping, headerRowOverrides);
      setResult(data);
      setReviewTransactions(data.transactionsForReview);
      // Only advance to review if at least one sheet imported successfully
      setStep(data.results.some(r => r.error === null) ? 'review' : 'summary');
      loadStatus();
    } catch (e) {
      message.error(`Import failed: ${String(e)}`);
      setStep(columnMapping ? 'columnMapping' : 'preview');
    } finally {
      setIsLoading(false);
    }
  }

  function handleColumnMappingConfirm(mapping: ColumnMappingMap, accountOverrides: Record<string, string>) {
    handleConfirm(accountOverrides, [], mapping);
  }

  async function handleReviewComplete(
    categoryOverrides: Record<string, string | null>,
    pmOverrides: Record<string, string>,
    skippedIds: string[],
  ) {
    setIsLoading(true);
    try {
      const categoryUpdates = Object.entries(categoryOverrides).map(([id, categoryId]) => ({ id, categoryId }));
      const pmUpdates = Object.entries(pmOverrides).map(([id, paymentMethod]) => ({ id, paymentMethod }));
      await Promise.all([
        categoryUpdates.length > 0 ? transactionsApi.bulkCategorize(categoryUpdates) : Promise.resolve(),
        pmUpdates.length > 0 ? transactionsApi.bulkSetPaymentMethod(pmUpdates) : Promise.resolve(),
        skippedIds.length > 0 ? transactionsApi.bulkDelete(skippedIds) : Promise.resolve(),
      ]);
      refreshAll();
      setStep('summary');
    } catch (e) {
      message.error(`Failed to save review: ${String(e)}`);
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

  return {
    step,
    status,
    activeDb,
    preview,
    result,
    reviewTransactions,
    isLoading,
    isResetting,
    currentFilename,
    handleFileSelect,
    handleHeaderSelectionConfirm,
    handleConfirm,
    handleColumnMappingConfirm,
    handleReviewComplete,
    handleReset,
    handleImportMore,
    handleGoToOverview,
  };
}
