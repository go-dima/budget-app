import { useCallback, useEffect, useState } from 'react';
import { message, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { categoryMappingApi, databasesApi, importApi, paymentMappingApi } from '../httpClient/client.js';
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
  const [skippedSheets, setSkippedSheets] = useState<string[]>([]);
  // column mapping confirmed in ColumnMappingStep, held until preview is confirmed
  const [pendingColumnMapping, setPendingColumnMapping] = useState<ColumnMappingMap | undefined>(undefined);
  const [pendingAccountOverrides, setPendingAccountOverrides] = useState<Record<string, string>>({});
  const [pendingCommit, setPendingCommit] = useState<{ fileId: string; filename: string } | null>(null);

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
      setSkippedSheets([]);
      setPendingColumnMapping(undefined);
      setPendingAccountOverrides({});
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

  function handleHeaderSelectionConfirm(overrides: Record<string, number>, skipped: string[]) {
    setHeaderRowOverrides(overrides);
    setSkippedSheets(skipped);
    if (!preview) return;
    const activeSheets = preview.sheets.filter(s => !skipped.includes(s.sheetName));
    const needsColumnMapping = activeSheets.some(s => (s.unknownColumns ?? []).length > 0);
    setStep(needsColumnMapping ? 'columnMapping' : 'preview');
  }

  async function handleConfirm(sheetNameOverrides: Record<string, string> = {}, selectedSheets: string[] = [], columnMapping?: ColumnMappingMap, fixBidi?: boolean) {
    if (!preview) return;
    // Merge account overrides from column mapping step (pendingAccountOverrides) with
    // any sheet-level name overrides from the preview step (sheetNameOverrides).
    const mergedOverrides = { ...pendingAccountOverrides, ...sheetNameOverrides };
    const resolvedMapping = columnMapping ?? pendingColumnMapping;
    setPendingColumnMapping(undefined);
    setPendingAccountOverrides({});
    setStep('importing');
    setIsLoading(true);
    try {
      const data = await importApi.execute({ fileId: preview.fileId, filename: currentFilename, sheetNameOverrides: mergedOverrides, selectedSheets, columnMapping: resolvedMapping, headerRowOverrides, fixBidi });
      setResult(data);
      setReviewTransactions(data.transactionsForReview);
      const hasSuccess = data.results.some(r => r.error === null);
      if (hasSuccess) {
        // Stage the commit info — actual DB write happens after review
        setPendingCommit({ fileId: preview.fileId, filename: currentFilename });
        setStep('review');
      } else {
        setStep('summary');
        runMappingRecalculation();
      }
      loadStatus();
    } catch (e) {
      message.error(`Import failed: ${String(e)}`);
      setStep(resolvedMapping ? 'columnMapping' : 'preview');
    } finally {
      setIsLoading(false);
    }
  }

  function handleColumnMappingConfirm(mapping: ColumnMappingMap, accountOverrides: Record<string, string>) {
    setPendingColumnMapping(mapping);
    setPendingAccountOverrides(accountOverrides);
    setStep('preview');
  }

  async function handleReviewComplete(
    categoryOverrides: Record<string, string | null>,
    pmOverrides: Record<string, string>,
    skippedIds: string[],
  ) {
    if (!pendingCommit) return;
    setIsLoading(true);
    try {
      const data = await importApi.commit({
        fileId: pendingCommit.fileId,
        filename: pendingCommit.filename,
        categoryOverrides,
        pmOverrides,
        skippedIds,
      });
      setResult(data);
      setPendingCommit(null);
      refreshAll();
      runMappingRecalculation();
      setStep('summary');
    } catch (e) {
      message.error(`Failed to save review: ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }

  function runMappingRecalculation() {
    Promise.all([
      categoryMappingApi.recalculate(),
      paymentMappingApi.recalculate(),
    ]).then(([cat, pm]) => {
      const total = cat.updated + pm.updated;
      notification.success({
        title: 'Mappings applied',
        description: total > 0
          ? `${cat.updated} category and ${pm.updated} payment assignments applied.`
          : 'No new mappings to apply.',
        placement: 'top',
        duration: 5,
      });
    }).catch(() => {
      notification.error({
        title: 'Mapping recalculation failed',
        description: 'Categories and payment methods could not be recalculated. You can retry from the mapping pages.',
        placement: 'top',
        duration: 0,
      });
    });
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
    setPendingCommit(null);
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
    skippedSheets,
    pendingAccountOverrides,
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
