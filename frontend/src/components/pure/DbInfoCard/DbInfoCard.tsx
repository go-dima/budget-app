import { Card, Descriptions, Button, Popconfirm } from "antd";
import { DatabaseOutlined, DeleteOutlined } from "@ant-design/icons";
import type { DbInfo } from "../../../types";
import { formatDate } from "../../../utils";
import "./DbInfoCard.css";

export interface DbInfoCardProps {
  database: DbInfo;
  onDelete?: (accountId: string) => void;
  deleting?: boolean;
}

export function DbInfoCard({ database, onDelete, deleting }: DbInfoCardProps) {
  return (
    <Card
      title={
        <span>
          <DatabaseOutlined /> {database.account_name}
        </span>
      }
      className="db-info-card"
      extra={
        onDelete && (
          <Popconfirm
            title="מחיקת מסד נתונים"
            description={`האם למחוק את "${database.account_name}"? פעולה זו לא ניתנת לביטול.`}
            onConfirm={() => onDelete(database.account_id)}
            okText="מחק"
            cancelText="ביטול"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              size="small"
            />
          </Popconfirm>
        )
      }
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="תנועות">
          {database.transaction_count.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="תנועה אחרונה">
          {database.last_transaction_date
            ? formatDate(database.last_transaction_date)
            : "אין תנועות"}
        </Descriptions.Item>
        <Descriptions.Item label="נתיב קובץ">
          <code className="db-path">{database.db_path}</code>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
