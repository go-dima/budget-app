import { Layout, Menu, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './SettingsPage.module.css';

const { Sider, Content } = Layout;
const { Title } = Typography;

const SETTINGS_MENU_ITEMS = [
  {
    key: 'config-group',
    label: 'Config',
    type: 'group' as const,
    children: [
      { key: '/settings/categories', label: 'Hidden Categories' },
      { key: '/settings/mapping', label: 'Category Mapping' },
      { key: '/settings/payment-mapping', label: 'Payment Mapping' },
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
    <Layout className={styles.layout}>
      <Sider width={200} className={styles.sider}>
        <div className={styles.siderHeader}>
          <SettingOutlined />
          <Title level={5} style={{ margin: 0 }}>Settings</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={SETTINGS_MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
          className={styles.menu}
        />
      </Sider>
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
