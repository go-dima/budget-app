import { Typography } from 'antd';

interface EmptyStateProps {
  title: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <Typography.Title level={3}>{title}</Typography.Title>
      {action && <div>{action}</div>}
    </div>
  );
}
