import { useState } from "react";
import { Steps, Button, Card, Alert, Space } from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  SwapOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type {
  FilePreviewResponse,
  SheetImportConfig,
  ImportExecuteResponse,
  ImportMode,
} from "../../../types";
import type { DbImportResult } from "../../../api/admin";
import { SheetSelector } from "./SheetSelector";
import { HeaderMapper } from "./HeaderMapper";
import { ImportModeSelector } from "./ImportModeSelector";
import { ImportProgress } from "./ImportProgress";
import { FileUploader } from "./FileUploader";
import "./ImportWizard.css";

export interface ImportWizardProps {
  onPreview: (file: File) => Promise<FilePreviewResponse>;
  onExecute: (fileId: string, configs: SheetImportConfig[]) => Promise<ImportExecuteResponse>;
  onImportDatabase?: (file: File) => Promise<DbImportResult>;
  onComplete?: () => void;
}

const steps = [
  {
    title: "העלאה",
    icon: <UploadOutlined />,
  },
  {
    title: "בחירת גיליונות",
    icon: <FileTextOutlined />,
  },
  {
    title: "אישור עמודות",
    icon: <FileTextOutlined />,
  },
  {
    title: "מצב ייבוא",
    icon: <SwapOutlined />,
  },
  {
    title: "סיום",
    icon: <CheckCircleOutlined />,
  },
];

export function ImportWizard({ onPreview, onExecute, onImportDatabase, onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [preview, setPreview] = useState<FilePreviewResponse | null>(null);
  const [configs, setConfigs] = useState<SheetImportConfig[]>([]);
  const [result, setResult] = useState<ImportExecuteResponse | null>(null);

  const handleFileUpload = async (file: File, type: "excel" | "database") => {
    setLoading(true);
    setError(null);

    if (type === "database") {
      // Direct database import - skip wizard steps
      if (!onImportDatabase) {
        setError("Database import is not supported");
        setLoading(false);
        return;
      }

      try {
        const dbResult = await onImportDatabase(file);
        // Convert to ImportExecuteResponse format
        setResult({
          success: dbResult.success,
          results: [{
            sheet_name: dbResult.account_name,
            account_name: dbResult.account_name,
            success: dbResult.success,
            rows_imported: dbResult.rows_imported,
            rows_skipped: 0,
            error: dbResult.error ?? null,
          }],
          total_rows_imported: dbResult.rows_imported,
          total_rows_skipped: 0,
        });
        setCurrentStep(4);
        onComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import database");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Excel file - proceed with wizard
    try {
      const previewData = await onPreview(file);
      setPreview(previewData);

      // Initialize configs with default values
      const initialConfigs: SheetImportConfig[] = previewData.sheets.map((sp) => ({
        sheet_name: sp.sheet.name,
        selected: true,
        header_mapping: { ...sp.sheet.detected_mapping },
        import_mode: sp.existing_db ? "append" : "override",
        target_db_name: sp.sheet.name, // Default to sheet name
        target_account_name: sp.sheet.name, // Default to sheet name
      }));
      setConfigs(initialConfigs);

      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview file");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelectionChange = (sheetName: string, selected: boolean) => {
    setConfigs((prev) =>
      prev.map((c) => (c.sheet_name === sheetName ? { ...c, selected } : c))
    );
  };

  const handleHeaderMappingChange = (
    sheetName: string,
    mapping: Record<string, string>
  ) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.sheet_name === sheetName ? { ...c, header_mapping: mapping } : c
      )
    );
  };

  const handleImportModeChange = (sheetName: string, mode: ImportMode) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.sheet_name === sheetName ? { ...c, import_mode: mode } : c
      )
    );
  };

  const handleDbNameChange = (sheetName: string, dbName: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.sheet_name === sheetName ? { ...c, target_db_name: dbName } : c
      )
    );
  };

  const handleAccountNameChange = (sheetName: string, accountName: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.sheet_name === sheetName ? { ...c, target_account_name: accountName } : c
      )
    );
  };

  const handleExecute = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);
    try {
      const executeResult = await onExecute(preview.file_id, configs);
      setResult(executeResult);
      setCurrentStep(4);
      // Refresh data immediately after successful import
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute import");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setPreview(null);
    setConfigs([]);
    setResult(null);
    setError(null);
    onComplete?.();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return configs.some((c) => c.selected);
      case 2:
        return configs
          .filter((c) => c.selected)
          .every((c) => Object.keys(c.header_mapping).length > 0);
      case 3:
        return configs.filter((c) => c.selected).length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <FileUploader onUpload={handleFileUpload} loading={loading} />;

      case 1:
        return preview ? (
          <SheetSelector
            sheets={preview.sheets}
            configs={configs}
            onSelectionChange={handleSheetSelectionChange}
            onDbNameChange={handleDbNameChange}
            onAccountNameChange={handleAccountNameChange}
          />
        ) : null;

      case 2:
        return preview ? (
          <HeaderMapper
            sheets={preview.sheets}
            configs={configs.filter((c) => c.selected)}
            onMappingChange={handleHeaderMappingChange}
          />
        ) : null;

      case 3:
        return preview ? (
          <ImportModeSelector
            sheets={preview.sheets}
            configs={configs.filter((c) => c.selected)}
            onModeChange={handleImportModeChange}
          />
        ) : null;

      case 4:
        return result ? (
          <ImportProgress result={result} onReset={handleReset} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Card className="import-wizard">
      <Steps current={currentStep} items={steps} size="small" />

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 16 }}
        />
      )}

      <div className="wizard-content">{renderStepContent()}</div>

      {currentStep > 0 && currentStep < 4 && (
        <div className="wizard-actions">
          <Space>
            <Button onClick={() => setCurrentStep((s) => s - 1)} disabled={loading}>
              הקודם
            </Button>
            {currentStep < 3 ? (
              <Button
                type="primary"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed() || loading}
              >
                הבא
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleExecute}
                loading={loading}
                disabled={!canProceed()}
              >
                בצע ייבוא
              </Button>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
}
