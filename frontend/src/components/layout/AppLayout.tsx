import { Layout, Menu } from "antd";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChartOutlined,
  DashboardOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { FilterSidebar } from "./FilterSidebar";
import "./AppLayout.css";

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: <Link to="/">Overview</Link>,
  },
  {
    key: "/report",
    icon: <BarChartOutlined />,
    label: <Link to="/report">Report</Link>,
  },
  {
    key: "/list",
    icon: <UnorderedListOutlined />,
    label: <Link to="/list">List</Link>,
  },
  {
    key: "/admin",
    icon: <SettingOutlined />,
    label: <Link to="/admin">Admin</Link>,
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="logo">Budget Viewer</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="nav-menu"
        />
      </Header>
      <Layout>
        <Sider width={280} className="app-sider">
          <FilterSidebar />
        </Sider>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
