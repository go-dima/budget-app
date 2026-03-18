import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { key: '/', label: 'Accounts' },
  { key: '/transactions', label: 'Transactions' },
  { key: '/reports', label: 'Reports' },
  { key: '/import', label: 'Import' },
  { key: '/config', label: 'Config' },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#001529' }}>
      <div
        style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginRight: 32, cursor: 'pointer', whiteSpace: 'nowrap' }}
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
    </Layout.Header>
  );
}
