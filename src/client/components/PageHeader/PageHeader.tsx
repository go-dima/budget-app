import type { ReactNode } from 'react';
import { Typography } from 'antd';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <Typography.Title level={2} style={{ margin: 0 }}>{title}</Typography.Title>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
