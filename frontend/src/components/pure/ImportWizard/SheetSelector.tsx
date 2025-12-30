import { Checkbox, Table, Tag, Typography, Input } from "antd";
import type { SheetPreview, SheetImportConfig } from "../../../types";
import { formatDate } from "../../../utils";

const { Text } = Typography;

export interface SheetSelectorProps {
  sheets: SheetPreview[];
  configs: SheetImportConfig[];
  onSelectionChange: (sheetName: string, selected: boolean) => void;
  onDbNameChange: (sheetName: string, dbName: string) => void;
  onAccountNameChange: (sheetName: string, accountName: string) => void;
}

export function SheetSelector({
  sheets,
  configs,
  onSelectionChange,
  onDbNameChange,
  onAccountNameChange,
}: SheetSelectorProps) {
  const columns = [
    {
      title: "",
      dataIndex: "selected",
      key: "selected",
      width: 50,
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);
        return (
          <Checkbox
            checked={config?.selected ?? false}
            onChange={(e) => onSelectionChange(record.sheet.name, e.target.checked)}
          />
        );
      },
    },
    {
      title: "גיליון",
      dataIndex: ["sheet", "name"],
      key: "name",
      width: 150,
    },
    {
      title: "שם קובץ DB",
      key: "db_name",
      width: 150,
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);
        return (
          <Input
            size="small"
            value={config?.target_db_name ?? record.sheet.name}
            onChange={(e) => onDbNameChange(record.sheet.name, e.target.value)}
            placeholder={record.sheet.name}
            disabled={!config?.selected}
          />
        );
      },
    },
    {
      title: "שם תצוגה",
      key: "account_name",
      width: 150,
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);
        return (
          <Input
            size="small"
            value={config?.target_account_name ?? record.sheet.name}
            onChange={(e) => onAccountNameChange(record.sheet.name, e.target.value)}
            placeholder={record.sheet.name}
            disabled={!config?.selected}
          />
        );
      },
    },
    {
      title: "שורות בקובץ",
      dataIndex: ["sheet", "row_count"],
      key: "row_count",
      width: 100,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: "DB קיים",
      key: "existing",
      render: (_: unknown, record: SheetPreview) => {
        const config = configs.find((c) => c.sheet_name === record.sheet.name);
        const dbName = config?.target_db_name ?? record.sheet.name;

        // Check if existing DB matches the target db name
        if (!record.existing_db || record.existing_db.account_name !== dbName) {
          return <Tag color="blue">חשבון חדש</Tag>;
        }
        return (
          <div>
            <div>{record.existing_db.existing_row_count.toLocaleString()} שורות</div>
            {record.existing_db.last_transaction_date && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                אחרון: {formatDate(record.existing_db.last_transaction_date)}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "עמודות",
      key: "headers",
      width: 80,
      render: (_: unknown, record: SheetPreview) => (
        <span>{record.sheet.headers.length}</span>
      ),
    },
  ];

  return (
    <div className="sheet-selector">
      <Typography.Title level={5}>בחירת גיליונות לייבוא</Typography.Title>
      <Typography.Paragraph type="secondary">
        בחר אילו גיליונות מקובץ האקסל לייבא. ניתן לשנות את שם החשבון (DB) לכל גיליון.
      </Typography.Paragraph>

      <Table
        dataSource={sheets}
        columns={columns}
        rowKey={(record) => record.sheet.name}
        pagination={false}
        size="small"
      />

      {sheets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            {configs.filter((c) => c.selected).length} מתוך {sheets.length} גיליונות נבחרו
          </Text>
        </div>
      )}
    </div>
  );
}
