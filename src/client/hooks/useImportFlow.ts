import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { databasesApi, importApi, transactionsApi } from '../httpClient/client.js';
import { useFilters } from '../contexts/FilterContext.js';
import type { DbEntry, ImportStatusResponse, ImportPreviewResponse, ImportExecuteResponse, ImportedTransactionReview } from '../../shared/types.js';

type Step = 'status' | 'preview' | 'importing' | 'review' | 'summary';

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
      setReviewTransactions(data.transactionsForReview);
      // Only advance to review if at least one sheet imported successfully
      setStep(data.results.some(r => r.error === null) ? 'review' : 'summary');
      loadStatus();
    } catch (e) {
      message.error(`Import failed: ${String(e)}`);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReviewComplete(overrides: Record<string, string | null>) {
    setIsLoading(true);
    try {
      const updates = Object.entries(overrides).map(([id, categoryId]) => ({ id, categoryId }));
      if (updates.length > 0) {
        await transactionsApi.bulkCategorize(updates);
      }
      refreshAll();
      setStep('summary');
    } catch (e) {
      message.error(`Failed to save categories: ${String(e)}`);
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
    handleConfirm,
    handleReviewComplete,
    handleReset,
    handleImportMore,
    handleGoToOverview,
  };
}
