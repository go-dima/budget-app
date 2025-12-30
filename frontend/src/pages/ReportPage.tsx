import { Alert, Card, Radio, Spin, Typography } from "antd";
import { useState } from "react";
import { ReportTable } from "../components/pure";
import { useAggregatedReport } from "../hooks";
import type { GroupByOption } from "../types";
import "./ReportPage.css";

const { Title } = Typography;

export function ReportPage() {
  const [groupBy, setGroupBy] = useState<GroupByOption>("month");
  const { report, isLoading, error } = useAggregatedReport(groupBy);

  return (
    <div className="report-page">
      <Title level={2}>Report</Title>

      <Card className="report-controls">
        <Radio.Group
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="month">By Month</Radio.Button>
          <Radio.Button value="category">By Category</Radio.Button>
          <Radio.Button value="year">By Year</Radio.Button>
        </Radio.Group>
      </Card>

      {isLoading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          type="error"
          message="Error loading report"
          description={error.message}
        />
      ) : (
        <Card>
          <ReportTable data={report} groupBy={groupBy} />
        </Card>
      )}
    </div>
  );
}
