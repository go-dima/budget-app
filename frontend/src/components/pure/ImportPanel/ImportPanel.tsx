import { Alert, Button, Card, Progress, Upload, message } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useState } from "react";
import type { ImportResult } from "../../../types";
import { formatDate } from "../../../utils";
import "./ImportPanel.css";

const { Dragger } = Upload;

export interface ImportPanelProps {
  onImport: (file: File) => Promise<ImportResult>;
  isImporting?: boolean;
  lastResult?: ImportResult | null;
}

export function ImportPanel({
  onImport,
  isImporting = false,
  lastResult,
}: ImportPanelProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps: UploadProps = {
    name: "file",
    accept: ".xlsx,.xls",
    fileList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => {
      setFileList(info.fileList.slice(-1)); // Only keep last file
    },
  };

  const handleImport = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.warning("Please select a file first");
      return;
    }

    try {
      const result = await onImport(fileList[0].originFileObj);
      if (result.errors.length === 0) {
        message.success(
          `Successfully imported ${result.transactions_imported} transactions`
        );
        setFileList([]);
      } else {
        message.warning(
          `Imported with ${result.errors.length} errors. Check the results below.`
        );
      }
    } catch {
      message.error("Failed to import file");
    }
  };

  return (
    <Card title="Import Excel File" className="import-panel">
      <Dragger {...uploadProps} disabled={isImporting}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag Excel file to this area
        </p>
        <p className="ant-upload-hint">
          Each sheet in the file will be imported as a separate account
        </p>
      </Dragger>

      <div className="import-actions">
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleImport}
          loading={isImporting}
          disabled={fileList.length === 0}
        >
          {isImporting ? "Importing..." : "Import"}
        </Button>
      </div>

      {isImporting && (
        <Progress percent={50} status="active" showInfo={false} />
      )}

      {lastResult && (
        <div className="import-result">
          <Alert
            type={lastResult.errors.length > 0 ? "warning" : "success"}
            message="Import Complete"
            description={
              <div>
                <p>Accounts created: {lastResult.accounts_created}</p>
                <p>Transactions imported: {lastResult.transactions_imported}</p>
                {lastResult.last_transaction_date && (
                  <p>
                    Last transaction date:{" "}
                    {formatDate(lastResult.last_transaction_date)}
                  </p>
                )}
                {lastResult.errors.length > 0 && (
                  <div className="errors">
                    <p>Errors:</p>
                    <ul>
                      {lastResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
          />
        </div>
      )}
    </Card>
  );
}
