import { useState } from "react";
import {
  Alert,
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  Row,
  Spin,
  Typography,
  message,
} from "antd";
import { DbInfoCard, ImportWizard } from "../components/pure";
import { useFilterContext } from "../contexts";
import { useDbInfo } from "../hooks";
import { adminApi } from "../api/admin";
import type { SheetImportConfig } from "../types";
import "./AdminPage.css";

const { Title } = Typography;

export function AdminPage() {
  const { databases, isLoading: dbLoading, error: dbError, refetch } = useDbInfo();
  const { allCategories, excludedCategories, refreshCategories } =
    useFilterContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePreview = async (file: File) => {
    return adminApi.previewImport(file);
  };

  const handleExecute = async (fileId: string, configs: SheetImportConfig[]) => {
    const result = await adminApi.executeImport({ file_id: fileId, sheets: configs });
    return result;
  };

  const handleComplete = async () => {
    await refetch();
    await refreshCategories();
  };

  const handleExcludedChange = async (checkedValues: string[]) => {
    try {
      await adminApi.setExcludedCategories(checkedValues);
      await refreshCategories();
      message.success("קטגוריות מוחרגות עודכנו");
    } catch {
      message.error("שגיאה בעדכון קטגוריות מוחרגות");
    }
  };

  const handleDeleteDatabase = async (accountId: string) => {
    setDeletingId(accountId);
    try {
      await adminApi.deleteDatabase(accountId);
      message.success("מסד הנתונים נמחק בהצלחה");
      await refetch();
      await refreshCategories();
    } catch {
      message.error("שגיאה במחיקת מסד הנתונים");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page">
      <Title level={2}>Admin</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <ImportWizard
            onPreview={handlePreview}
            onExecute={handleExecute}
            onComplete={handleComplete}
          />
        </Col>

        <Col xs={24} xl={10}>
          <Card title="מסדי נתונים טעונים" className="db-list-card">
            {dbLoading ? (
              <div className="loading-container">
                <Spin />
              </div>
            ) : dbError ? (
              <Alert
                type="error"
                message="Error loading databases"
                description={dbError.message}
              />
            ) : databases.length === 0 ? (
              <Empty description="אין מסדי נתונים טעונים" />
            ) : (
              <Row gutter={[16, 16]}>
                {databases.map((db) => (
                  <Col span={24} key={db.account_id}>
                    <DbInfoCard
                      database={db}
                      onDelete={handleDeleteDatabase}
                      deleting={deletingId === db.account_id}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="קטגוריות מוחרגות כברירת מחדל" className="excluded-categories">
        <p className="hint">
          בחר קטגוריות להחרגה מהסינון כברירת מחדל. המשתמש יכול עדיין להוסיף אותן ידנית.
        </p>
        {allCategories.length === 0 ? (
          <Empty description="אין קטגוריות זמינות. יש לייבא נתונים קודם." />
        ) : (
          <Checkbox.Group
            value={excludedCategories}
            onChange={(values) => handleExcludedChange(values as string[])}
          >
            <Row>
              {allCategories.map((category) => (
                <Col span={8} key={category}>
                  <Checkbox value={category}>{category}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        )}
      </Card>
    </div>
  );
}
