import { useEffect, useState } from 'react';
import { Button, Card, Input, List, Space, Tag, Typography, Spin } from 'antd';
import { CheckOutlined, DatabaseOutlined, PlusOutlined } from '@ant-design/icons';
import { databasesApi } from '../../httpClient/client.js';
import type { DbEntry } from '../../../shared/types.js';

const { Text } = Typography;

interface DbPickerProps {
  onSwitched: () => void;
}

export function DbPicker({ onSwitched }: DbPickerProps) {
  const [dbs, setDbs] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

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
                actions={[
                  db.isActive
                    ? <Tag icon={<CheckOutlined />} color="success">Active</Tag>
                    : (
                      <Button
                        size="small"
                        loading={switching === db.filename}
                        onClick={() => handleSwitch(db.filename)}
                      >
                        Load
                      </Button>
                    ),
                ]}
              >
                <Space>
                  <Text strong={db.isActive}>{db.name}</Text>
                  {db.createdAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>{db.createdAt}</Text>
                  )}
                </Space>
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
