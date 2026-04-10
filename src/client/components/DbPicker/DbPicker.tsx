import { Button, Card, Input, Popconfirm, Space, Tag, Typography, Spin } from 'antd';
import { CheckOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { DbEntry } from '../../../shared/types.js';
import styles from './DbPicker.module.css';

const { Text } = Typography;

export interface DbPickerProps {
  dbs: DbEntry[];
  loading: boolean;
  newName: string;
  setNewName: (v: string) => void;
  creating: boolean;
  switching: string | null;
  deleting: string | null;
  editingFilename: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  activeDb: DbEntry | undefined;
  handleSwitch: (filename: string) => void;
  handleDelete: (filename: string) => void;
  startEdit: (db: DbEntry) => void;
  commitEdit: (filename: string) => void;
  cancelEdit: () => void;
  handleCreate: () => void;
  viewingFilename?: string;
  onView?: (filename: string) => void;
}

export function DbPicker({
  dbs, loading, newName, setNewName, creating, switching, deleting,
  editingFilename, editValue, setEditValue, activeDb,
  handleSwitch, handleDelete, startEdit, commitEdit, cancelEdit, handleCreate,
  viewingFilename, onView,
}: DbPickerProps) {
  return (
    <Card
      title={<Space><DatabaseOutlined /><span>Database</span></Space>}
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <Spin size="small" />
      ) : (
        <Space orientation="vertical" className="full-width">
          <div className={styles.dbList}>
            {dbs.map(db => (
              <div
                key={db.filename}
                className={[
                  styles.dbRow,
                  onView ? styles.dbRowClickable : '',
                  viewingFilename === db.filename ? styles.dbRowActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onView?.(db.filename)}
              >
                <div>
                  {editingFilename === db.filename ? (
                    <Input
                      size="small"
                      value={editValue}
                      autoFocus
                      onChange={e => setEditValue(e.target.value)}
                      onPressEnter={() => commitEdit(db.filename)}
                      onBlur={() => commitEdit(db.filename)}
                      onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                      className={styles.nameInput}
                    />
                  ) : (
                    <Space>
                      <Text strong={db.isActive}>{db.name}</Text>
                      {db.createdAt && (
                        <Text type="secondary" className="text-sm">last updated {db.createdAt}</Text>
                      )}
                    </Space>
                  )}
                </div>
                <Space size="small" onClick={e => e.stopPropagation()}>
                  {db.isActive
                    ? <Tag icon={<CheckOutlined />} color="success">Active</Tag>
                    : (
                      <Button
                        size="small"
                        loading={switching === db.filename}
                        onClick={() => handleSwitch(db.filename)}
                      >
                        Load
                      </Button>
                    )}
                  {editingFilename !== db.filename && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => startEdit(db)}
                    />
                  )}
                  {!db.isActive && editingFilename !== db.filename && (
                    <Popconfirm
                      title={`Delete "${db.name}"?`}
                      description="This will permanently delete the database file."
                      onConfirm={() => handleDelete(db.filename)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleting === db.filename}
                      />
                    </Popconfirm>
                  )}
                </Space>
              </div>
            ))}
            <div className={styles.addRow}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={`New database name (default: ${activeDb?.name ?? 'date'})`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onPressEnter={handleCreate}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={creating}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Space>
      )}
    </Card>
  );
}
