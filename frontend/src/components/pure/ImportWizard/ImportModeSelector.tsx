import { Radio, Typography, Table, Tag, Alert, Space } from "antd";
import {
  WarningOutlined,
  PlusCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { SheetPreview, SheetImportConfig, ImportMode } from "../../../types";
import { formatDate } from "../../../utils";

const { Text } = Typography;

export interface ImportModeSelectorProps {
  sheets: SheetPreview[];
  configs: SheetImportConfig[];
  onModeChange: (sheetName: string, mode: ImportMode) => void;
}

export function ImportModeSelector({
  sheets,
  configs,
  onModeChange,
}: ImportModeSelectorProps) {
  const selectedSheets = sheets.filter((s) =>
    configs.some((c) => c.sheet_name === s.sheet.name)
  );

  const columns = [
    {
      title: "Sheet Name",
      dataIndex: ["sheet", "name"],
      key: "name",
    },
    {
      title: "File Rows",
      dataIndex: ["sheet", "row_count"],
      key: "file_rows",
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: "Existing DB",
      key: "existing",
      render: (_: unknown, record: SheetPreview) => {
        if (!record.existing_db) {
          return <Tag color="green">New</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <span>{record.existing_db.existing_row_count.toLocaleString()} rows</span>
            {record.existing_db.last_transaction_date && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Last: {formatDate(record.existing_db.last_transaction_date)}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Import Mode",
      key: "mode",
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);
        const hasExisting = !!record.existing_db;

        return (
          <Radio.Group
            value={config?.import_mode}
            onChange={(e) => onModeChange(record.sheet.name, e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="override">
              <SyncOutlined /> Override
            </Radio.Button>
            <Radio.Button value="append" disabled={!hasExisting}>
              <PlusCircleOutlined /> Append
            </Radio.Button>
          </Radio.Group>
        );
      },
    },
    {
      title: "Result",
      key: "result",
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);

        if (config?.import_mode === "override") {
          return (
            <Text type="warning">
              <WarningOutlined /> Replace all data
            </Text>
          );
        }

        if (config?.import_mode === "append" && record.existing_db) {
          return (
            <Text type="success">
              <PlusCircleOutlined /> Add newer transactions
            </Text>
          );
        }

        return <Tag color="blue">Create new account</Tag>;
      },
    },
  ];

  const overrideCount = configs.filter(
    (c) => c.selected && c.import_mode === "override"
  ).length;

  return (
    <div className="import-mode-selector">
      <Typography.Title level={5}>Select Import Mode</Typography.Title>
      <Typography.Paragraph type="secondary">
        Choose how to handle each sheet. "Override" will replace all existing data.
        "Append" will only add transactions newer than the last imported transaction.
      </Typography.Paragraph>

      {overrideCount > 0 && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message={`${overrideCount} sheet(s) will have their data overwritten`}
          description="Override mode will delete all existing transactions and replace them with data from the Excel file."
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Table
        dataSource={selectedSheets}
        columns={columns}
        rowKey={(record) => record.sheet.name}
        pagination={false}
        size="small"
      />
    </div>
  );
}
