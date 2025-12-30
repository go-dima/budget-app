import { Table, Tag, Typography, Collapse, Space } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { SheetPreview, SheetImportConfig } from "../../../types";

const { Text } = Typography;

export interface HeaderMapperProps {
  sheets: SheetPreview[];
  configs: SheetImportConfig[];
  onMappingChange: (sheetName: string, mapping: Record<string, string>) => void;
}

// Field descriptions for display (Hebrew)
const FIELD_LABELS: Record<string, string> = {
  date: "תאריך",
  description: "תיאור",
  payment_method: "אמצעי תשלום",
  category: "קטגוריה",
  details: "פירוט",
  reference: "אסמכתא",
  expense: "חובה",
  income: "זכות",
  balance: "יתרה",
};

export function HeaderMapper({ sheets, configs }: HeaderMapperProps) {
  const selectedSheets = sheets.filter((s) =>
    configs.some((c) => c.sheet_name === s.sheet.name)
  );

  const collapseItems = selectedSheets.map((sheetPreview) => {
    const config = configs.find((c) => c.sheet_name === sheetPreview.sheet.name);
    const mapping = config?.header_mapping ?? {};

    const mappingData = Object.entries(mapping).map(([hebrew, field]) => ({
      key: hebrew,
      hebrew,
      field,
    }));

    const columns = [
      {
        title: "Hebrew Header",
        dataIndex: "hebrew",
        key: "hebrew",
        render: (text: string) => (
          <Text code style={{ direction: "rtl" }}>
            {text}
          </Text>
        ),
      },
      {
        title: "Maps To",
        key: "arrow",
        width: 60,
        render: () => <span>→</span>,
      },
      {
        title: "Field",
        dataIndex: "field",
        key: "field",
        render: (field: string) => (
          <Tag color="blue">{FIELD_LABELS[field] ?? field}</Tag>
        ),
      },
    ];

    // Sample data table
    const sampleColumns = sheetPreview.sheet.headers.map((header) => ({
      title: <span style={{ direction: "rtl" }}>{header}</span>,
      dataIndex: header,
      key: header,
      ellipsis: true,
    }));

    return {
      key: sheetPreview.sheet.name,
      label: (
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <span>{sheetPreview.sheet.name}</span>
          <Tag>{mappingData.length} columns mapped</Tag>
        </Space>
      ),
      children: (
        <div>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Column Mapping
          </Typography.Title>
          <Table
            dataSource={mappingData}
            columns={columns}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          {sheetPreview.sheet.sample_rows.length > 0 && (
            <>
              <Typography.Title level={5}>Sample Data (First 3 rows)</Typography.Title>
              <Table
                dataSource={sheetPreview.sheet.sample_rows.map((row, idx) => ({
                  ...row,
                  _key: idx,
                }))}
                columns={sampleColumns}
                pagination={false}
                size="small"
                scroll={{ x: true }}
                rowKey="_key"
              />
            </>
          )}
        </div>
      ),
    };
  });

  return (
    <div className="header-mapper">
      <Typography.Title level={5}>Confirm Header Mappings</Typography.Title>
      <Typography.Paragraph type="secondary">
        Review the detected column mappings for each sheet. The Hebrew column headers
        from your Excel file are automatically mapped to the corresponding fields.
      </Typography.Paragraph>

      <Collapse items={collapseItems} defaultActiveKey={[selectedSheets[0]?.sheet.name]} />
    </div>
  );
}
