import { Result, Button, Table, Tag, Typography, Card, Statistic, Row, Col } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { ImportExecuteResponse, SheetImportResult } from "../../../types";

const { Text } = Typography;

export interface ImportProgressProps {
  result: ImportExecuteResponse;
  onReset: () => void;
}

export function ImportProgress({ result, onReset }: ImportProgressProps) {
  const columns = [
    {
      title: "Sheet",
      dataIndex: "sheet_name",
      key: "sheet_name",
    },
    {
      title: "Account",
      dataIndex: "account_name",
      key: "account_name",
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: SheetImportResult) =>
        record.success ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Success
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Failed
          </Tag>
        ),
    },
    {
      title: "Imported",
      dataIndex: "rows_imported",
      key: "rows_imported",
      render: (count: number) => (
        <Text type="success">{count.toLocaleString()}</Text>
      ),
    },
    {
      title: "Skipped",
      dataIndex: "rows_skipped",
      key: "rows_skipped",
      render: (count: number) =>
        count > 0 ? (
          <Text type="secondary">{count.toLocaleString()}</Text>
        ) : (
          "-"
        ),
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
      render: (error: string | null) =>
        error ? <Text type="danger">{error}</Text> : "-",
    },
  ];

  const successCount = result.results.filter((r) => r.success).length;
  const failedCount = result.results.filter((r) => !r.success).length;

  return (
    <div className="import-progress">
      <Result
        status={result.success ? "success" : "warning"}
        title={result.success ? "Import Completed Successfully" : "Import Completed with Errors"}
        icon={<FileExcelOutlined />}
        subTitle={
          result.success
            ? `Successfully imported ${result.total_rows_imported.toLocaleString()} transactions`
            : `${failedCount} sheet(s) failed to import`
        }
        extra={[
          <Button type="primary" key="done" onClick={onReset}>
            Done
          </Button>,
        ]}
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Sheets Processed"
              value={result.results.length}
              prefix={<FileExcelOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Successful"
              value={successCount}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Rows Imported"
              value={result.total_rows_imported}
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Rows Skipped"
              value={result.total_rows_skipped}
              valueStyle={{ color: "#999" }}
            />
          </Col>
        </Row>
      </Card>

      <Typography.Title level={5}>Import Details</Typography.Title>
      <Table
        dataSource={result.results}
        columns={columns}
        rowKey="sheet_name"
        pagination={false}
        size="small"
      />
    </div>
  );
}
