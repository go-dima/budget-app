import { Layout, Menu, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title } = Typography;

const SETTINGS_MENU_ITEMS = [
  {
    key: 'config-group',
    label: 'Config',
    type: 'group' as const,
    children: [
      { key: '/settings/categories', label: 'Hidden Categories' },
    ],
  },
  {
    key: 'database-group',
    label: 'Database',
    type: 'group' as const,
    children: [
      { key: '/settings/databases', label: 'Databases' },
      { key: '/settings/import', label: 'Import' },
    ],
  },
];

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100%', background: '#fff' }}>
      <Sider width={200} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined />
          <Title level={5} style={{ margin: 0 }}>Settings</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={SETTINGS_MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Content style={{ padding: 24, overflowY: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
