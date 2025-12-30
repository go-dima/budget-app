import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";

export interface FileUploaderProps {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export function FileUploader({ onUpload, loading }: FileUploaderProps) {
  const handleBeforeUpload = (file: File) => {
    onUpload(file);
    return false; // Prevent auto upload
  };

  return (
    <div className="file-uploader">
      <Upload.Dragger
        name="file"
        accept=".xlsx,.xls"
        beforeUpload={handleBeforeUpload}
        showUploadList={false}
        disabled={loading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag Excel file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Supports .xlsx and .xls files. Each sheet will be imported as a separate
          account.
        </p>
      </Upload.Dragger>
    </div>
  );
}
