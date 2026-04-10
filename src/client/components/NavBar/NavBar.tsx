import { Button, Layout, Menu } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './NavBar.module.css';

const NAV_ITEMS = [
  { key: '/', label: 'Accounts' },
  { key: '/transactions', label: 'Transactions' },
  { key: '/reports', label: 'Reports' },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettings = location.pathname.startsWith('/settings');

  return (
    <Layout.Header className={styles.header}>
      <div
        className={styles.logo}
        onClick={() => navigate('/')}
      >
        Budget Viewer
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={NAV_ITEMS}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button
        type={isSettings ? 'primary' : 'text'}
        icon={<SettingOutlined />}
        onClick={() => navigate('/settings')}
        className={isSettings ? styles.settingsBtn : styles.settingsBtnLight}
      >
        Settings
      </Button>
    </Layout.Header>
  );
}
