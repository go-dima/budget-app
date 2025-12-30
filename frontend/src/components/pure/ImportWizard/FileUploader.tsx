import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";

export interface FileUploaderProps {
  onUpload: (file: File, type: "excel" | "database") => void;
  loading?: boolean;
}

export function FileUploader({ onUpload, loading }: FileUploaderProps) {
  const handleBeforeUpload = (file: File) => {
    const isDatabase = file.name.toLowerCase().endsWith(".db");
    onUpload(file, isDatabase ? "database" : "excel");
    return false; // Prevent auto upload
  };

  return (
    <div className="file-uploader">
      <Upload.Dragger
        name="file"
        accept=".xlsx,.xls,.db"
        beforeUpload={handleBeforeUpload}
        showUploadList={false}
        disabled={loading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Supports Excel files (.xlsx, .xls) or SQLite database files (.db)
        </p>
      </Upload.Dragger>
    </div>
  );
}
