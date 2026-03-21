import { useEffect, useState } from 'react';
import { Button, Card, Input, List, Popconfirm, Space, Tag, Typography, Spin } from 'antd';
import { CheckOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { databasesApi } from '../../httpClient/client.js';
import type { DbEntry } from '../../../shared/types.js';

const { Text } = Typography;

interface DbPickerProps {
  onSwitched: () => void;
  viewingFilename?: string;
  onView?: (filename: string) => void;
}

export function DbPicker({ onSwitched, viewingFilename, onView }: DbPickerProps) {
  const [dbs, setDbs] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const activeDb = dbs.find(d => d.isActive);

  useEffect(() => { loadDbs(); }, []);

  async function loadDbs() {
    setLoading(true);
    try { setDbs(await databasesApi.list()); }
    finally { setLoading(false); }
  }

  async function handleSwitch(filename: string) {
    setSwitching(filename);
    try {
      await databasesApi.switch(filename);
      await loadDbs();
      onSwitched();
    } finally { setSwitching(null); }
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      await databasesApi.delete(filename);
      await loadDbs();
    } finally { setDeleting(null); }
  }

  function startEdit(db: DbEntry) {
    setEditingFilename(db.filename);
    setEditValue(db.name);
  }

  async function commitEdit(filename: string) {
    if (!editValue.trim()) { cancelEdit(); return; }
    try {
      await databasesApi.rename(filename, editValue.trim());
      await loadDbs();
      // If we renamed the active db, notify parent to refresh
      const wasActive = dbs.find(d => d.filename === filename)?.isActive;
      if (wasActive) onSwitched();
    } finally { cancelEdit(); }
  }

  function cancelEdit() {
    setEditingFilename(null);
    setEditValue('');
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await databasesApi.create(newName.trim());
      setNewName('');
      await loadDbs();
      onSwitched();
    } finally { setCreating(false); }
  }

  return (
    <Card
      title={<Space><DatabaseOutlined /><span>Database</span></Space>}
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <Spin size="small" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <List
            size="small"
            bordered
            dataSource={dbs}
            renderItem={db => (
              <List.Item
                style={{
                  cursor: onView ? 'pointer' : 'default',
                  background: viewingFilename === db.filename ? '#e6f4ff' : undefined,
                  borderRadius: 4,
                  transition: 'background 0.15s',
                }}
                onClick={() => onView?.(db.filename)}
                actions={[
                  db.isActive
                    ? <Tag icon={<CheckOutlined />} color="success">Active</Tag>
                    : (
                      <Button
                        size="small"
                        loading={switching === db.filename}
                        onClick={e => { e.stopPropagation(); handleSwitch(db.filename); }}
                      >
                        Load
                      </Button>
                    ),
                  editingFilename !== db.filename && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={e => { e.stopPropagation(); startEdit(db); }}
                    />
                  ),
                  !db.isActive && editingFilename !== db.filename && (
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
                        onClick={e => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                {editingFilename === db.filename ? (
                  <Input
                    size="small"
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onPressEnter={() => commitEdit(db.filename)}
                    onBlur={() => commitEdit(db.filename)}
                    onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                    style={{ width: 180 }}
                  />
                ) : (
                  <Space>
                    <Text strong={db.isActive}>{db.name}</Text>
                    {db.createdAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>last updated {db.createdAt}</Text>
                    )}
                  </Space>
                )}
              </List.Item>
            )}
            footer={
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
            }
          />
        </Space>
      )}
    </Card>
  );
}
